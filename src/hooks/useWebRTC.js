import {useEffect, useRef, useCallback, useState} from 'react';
import freeice from 'freeice';
import useStateWithCallback from './useStateWithCallback';
import socket from '../socket';
import ACTIONS from '../socket/actions';
export const LOCAL_VIDEO = 'LOCAL_VIDEO';


export default function useWebRTC(roomID) {
  //Все доступные клиенты
  const [clients, updateClients] = useStateWithCallback([]);
  const [isModerator, setIsModerator] = useState(false);

  const addNewClient = useCallback((newClient, cb) => {
    updateClients(list => {
      if (!list.includes(newClient)) {
        return [...list, newClient]
      }

      return list;
    }, cb);
  }, [updateClients]);

  //Соединения с другими пользователями
  const peerConnections = useRef({});
  //Ссылка на свой видеоэлемент, который транслируется с вебкамеры
  const localMediaStream = useRef(null);
  //Ссылка на все видеоэлементы на странице
  const peerMediaElements = useRef({
    [LOCAL_VIDEO]: null,
  });

  // useEffect(()=>{
  //   socket.on(ACTIONS.TEST, ({clients,roomID}) =>{
  //     console.log(`usewebrtc action test: \nclients ${clients}\nroomID ${roomID}`);
  //   })
  // })

  useEffect(() => {
    //Функция добавления нового пира при ADD_PEER
    async function handleNewPeer({peerID, createOffer}) {
      if (peerID in peerConnections.current) {
        return console.warn(`Already connected to peer ${peerID}`);
      }

      //Создание объекта RTCPeerConnetion
      peerConnections.current[peerID] = new RTCPeerConnection({
        iceServers: freeice(), //предоставляем набор адресов ice серверов
      });

      //Новый кандидат желает подключится, отправляем другим клиентам. Срабатывает после setLocalDescription
      peerConnections.current[peerID].onicecandidate = event => {
        if (event.candidate) {
          socket.emit(ACTIONS.RELAY_ICE, {
            peerID,
            iceCandidate: event.candidate,
          });
        }
      }

      let tracksNumber = 0;
      //При получении нового трека извлекаем стримы (remoteStream)
      peerConnections.current[peerID].ontrack = ({streams: [remoteStream]}) => {
        tracksNumber++

        if (tracksNumber === 2) { // video & audio tracks received
          tracksNumber = 0;
          //Добавляем нового клиента, рендерим 
          addNewClient(peerID, () => {
            if (peerMediaElements.current[peerID]) {
              //Транслируем в видеоэлементе, который создался для PeerID remoteStream.
              peerMediaElements.current[peerID].srcObject = remoteStream;
            } else {
              // FIX LONG RENDER IN CASE OF MANY CLIENTS
              let settled = false;
              const interval = setInterval(() => {
                if (peerMediaElements.current[peerID]) {
                  peerMediaElements.current[peerID].srcObject = remoteStream;
                  settled = true;
                }

                if (settled) {
                  clearInterval(interval);
                }
              }, 1000);
            }
          });
        }
      }

      //Добавляем к peerConnetion наши localMediaStream треки.
      localMediaStream.current.getTracks().forEach(track => {
        peerConnections.current[peerID].addTrack(track, localMediaStream.current);
      });
      //Создание оффера
      if (createOffer) {
        const offer = await peerConnections.current[peerID].createOffer();

        //После этого срабатывает eventListener onicecandidate
        await peerConnections.current[peerID].setLocalDescription(offer);

        socket.emit(ACTIONS.RELAY_SDP, {
          peerID,
          sessionDescription: offer,
        });
      }
    }

    socket.on(ACTIONS.ADD_PEER, handleNewPeer);

    return () => {
      socket.off(ACTIONS.ADD_PEER);
    }
  }, [addNewClient]);

  useEffect(() => {
    
    //Функция для обработки remote description
    async function setRemoteMedia({peerID, sessionDescription: remoteDescription}) {
      await peerConnections.current[peerID]?.setRemoteDescription(
        new RTCSessionDescription(remoteDescription)
      );

      //Если получили предложение, то создаём ответ
      if (remoteDescription.type === 'offer') {
        const answer = await peerConnections.current[peerID].createAnswer();

        await peerConnections.current[peerID].setLocalDescription(answer);
        //Отправляем ответ
        socket.emit(ACTIONS.RELAY_SDP, {
          peerID,
          sessionDescription: answer,
        });
      }
    }

    //Реагирование на получение remote description
    socket.on(ACTIONS.SESSION_DESCRIPTION, setRemoteMedia)

    return () => {
      socket.off(ACTIONS.SESSION_DESCRIPTION);
    }
  }, []);

  useEffect(() => {
    //Реагирование на получение ICE CANDIDATE
    socket.on(ACTIONS.ICE_CANDIDATE, ({peerID, iceCandidate}) => {
      peerConnections.current[peerID]?.addIceCandidate(
        new RTCIceCandidate(iceCandidate)
      );
    });

    return () => {
      socket.off(ACTIONS.ICE_CANDIDATE);
    }
  }, []);

  useEffect(() => {
    const handleRemovePeer = ({peerID}) => {
      if (peerConnections.current[peerID]) {
        peerConnections.current[peerID].close();
      }

      delete peerConnections.current[peerID];
      delete peerMediaElements.current[peerID];

      updateClients(list => list.filter(c => c !== peerID));
    };
    //При удалении соединения
    socket.on(ACTIONS.REMOVE_PEER, handleRemovePeer);

    return () => {
      socket.off(ACTIONS.REMOVE_PEER);
    }
  }, [updateClients]);

  //UseEffect в котором захватывается медиа и добавляется в localMediaStream, после этого вызывается socket JOIN
  useEffect(() => {
    //Функция захвата видео с камеры
    async function startCapture() {
      try{
      localMediaStream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: 800,
          height: 600,
          // width: 1280,
          // height: 720,
        }
        // video:false
      });

      
      addNewClient(LOCAL_VIDEO, () => {
        const localVideoElement = peerMediaElements.current[LOCAL_VIDEO];

        if (localVideoElement) {
          localVideoElement.volume = 0;
          localVideoElement.srcObject = localMediaStream.current;
        }
      });
    } catch (error) {
      console.error('Ошибка при получении мультимедиа:', error);
    }
      
    }
    startCapture()
      .then(() => socket.emit(ACTIONS.JOIN, {room: roomID}))
      .catch(e => console.error('Error getting userMedia:', e));

    return () => {
      if (localMediaStream.current) {
      localMediaStream.current.getTracks().forEach(track => track.stop());
    }
      socket.emit(ACTIONS.LEAVE);
    };
  }, [addNewClient,roomID]);


  // Добавляем useEffect для обработки включения/выключения камеры
  useEffect(() => {
    const handleModeratorAction = ({ action }) => {
      if (action === 'toggleCamera') {
        const videoTrack = localMediaStream.current.getVideoTracks()[0];
        if (videoTrack) {
          console.log(`Video track enabled (before): ${videoTrack.enabled}`);
          videoTrack.enabled = !videoTrack.enabled;
          console.log(`Video track enabled (after): ${videoTrack.enabled}`);

          // Обновляем RTCPeerConnection для каждого клиента
          Object.keys(peerConnections.current).forEach(peerID => {
            const peerConnection = peerConnections.current[peerID];
            const sender = peerConnection.getSenders().find(s => s.track.kind === 'video');
            if (sender) {
              sender.replaceTrack(videoTrack);
            }
          });
        }
      }
      
    if (action === 'toggleMic') {
      const audioTrack = localMediaStream.current.getAudioTracks()[0];
      if (audioTrack) {
        console.log(`Audio track enabled (before): ${audioTrack.enabled}`);
        audioTrack.enabled = !audioTrack.enabled;
        console.log(`Audio track enabled (after): ${audioTrack.enabled}`);
  
        // Обновляем RTCPeerConnection для каждого клиента
        Object.keys(peerConnections.current).forEach(peerID => {
          const peerConnection = peerConnections.current[peerID];
          const sender = peerConnection.getSenders().find(s => s.track.kind === 'audio');
          if (sender) {
            sender.replaceTrack(audioTrack);
          }
        });
      }
    }
    };

    socket.on(ACTIONS.MODERATOR_ACTION, handleModeratorAction);

    return () => {
      socket.off(ACTIONS.MODERATOR_ACTION, handleModeratorAction);
    };
  }, []);

  useEffect(()=>{
    const handleToggleMyMIC = ()=>{
      const audioTrack = localMediaStream.current.getVideoTracks()[1];
      if (audioTrack) {
        console.log(`Audio track enabled (before): ${audioTrack.enabled}`);
        audioTrack.enabled = !audioTrack.enabled;
        console.log(`Audio track enabled (after): ${audioTrack.enabled}`);

        // Обновляем RTCPeerConnection для каждого клиента
        Object.keys(peerConnections.current).forEach(peerID => {
          const peerConnection = peerConnections.current[peerID];
          const sender = peerConnection.getSenders().find(s => s.track.kind === 'audio');
          if (sender) {
            sender.replaceTrack(audioTrack);
          }
        });
      }
      Object.keys(peerConnections.current).forEach(peerID =>{
        console.log(`test${peerID}: ${peerConnections.current[peerID].getSenders()}\n`);
      })
    }
    socket.on(ACTIONS.TOGGLE_MY_MIC, handleToggleMyMIC);
    return () => {
      socket.off(ACTIONS.TOGGLE_MY_MIC, handleToggleMyMIC);
    };
  })
  
  useEffect(()=>{
    const handleToggleMyCam = ()=>{
      const videoTrack = localMediaStream.current.getVideoTracks()[0];
      if (videoTrack) {
        console.log(`Video track enabled (before): ${videoTrack.enabled}`);
        videoTrack.enabled = !videoTrack.enabled;
        console.log(`Video track enabled (after): ${videoTrack.enabled}`);

        // Обновляем RTCPeerConnection для каждого клиента
        Object.keys(peerConnections.current).forEach(peerID => {
          const peerConnection = peerConnections.current[peerID];
          const sender = peerConnection.getSenders().find(s => s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });
      }
    }
    socket.on(ACTIONS.TOGGLE_MY_CAM, handleToggleMyCam);
    return () => {
      socket.off(ACTIONS.TOGGLE_MY_CAM, handleToggleMyCam);
    };
  })
  
  useEffect(() => {
    socket.on(ACTIONS.SET_MODERATOR, ({ isModerator }) => {
      setIsModerator(isModerator);
    });

    socket.on(ACTIONS.MODERATOR_ACTION, ({ action }) => {
      // Handle actions for toggling mic, camera, etc.
      console.log(`Action from moderator: ${action}`);
    });

    return () => {
      socket.off(ACTIONS.SET_MODERATOR);
      socket.off(ACTIONS.MODERATOR_ACTION);
    };
  }, []);
  
  const provideMediaRef = useCallback((id, node) => {
    peerMediaElements.current[id] = node;
  }, []);

  
  return {
    clients,
    provideMediaRef,
    isModerator
  };

}
