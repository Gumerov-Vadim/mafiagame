import {useEffect, useRef, useCallback} from 'react';
import freeice from 'freeice';
import useStateWithCallback from './useStateWithCallback';
import socket from '../socket';
import ACTIONS from '../socket/actions';

export const LOCAL_VIDEO = 'LOCAL_VIDEO';


export default function useWebRTC(roomID) {
  //Все доступные клиенты
  const [clients, updateClients] = useStateWithCallback([]);

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

  
  const enableCamera = useCallback((peerID) => {
    console.log(`enableCamera peerID:${peerID}`);
    if (peerID === LOCAL_VIDEO) {
      localMediaStream.current.getVideoTracks().forEach(track => (track.enabled = true));
    } else {
      const videoElement = peerMediaElements.current[peerID];
      if (videoElement && videoElement.srcObject) {
        videoElement.srcObject.getTracks().forEach(track => (track.enabled = true));
      }
      socket.emit(ACTIONS.ENABLE_CAMERA, { peerID });
    }
  }, []);

  const disableCamera = useCallback((peerID) => {
    console.log(`disableCamera peerID:${peerID}`);
    if (peerID === LOCAL_VIDEO) {
      localMediaStream.current.getVideoTracks().forEach(track => (track.enabled = false));
    } else {
      const videoElement = peerMediaElements.current[peerID];
      if (videoElement && videoElement.srcObject) {
        videoElement.srcObject.getTracks().forEach(track => (track.enabled = false));
      }
      socket.emit(ACTIONS.DISABLE_CAMERA, { peerID });
    }
  }, []);

  useEffect(() => {
    socket.on(ACTIONS.ENABLE_CAMERA, ({ peerID }) => {
      console.log(`socket on enableCamera peerID:${peerID}`);
      const videoElement = peerMediaElements.current[peerID];
      if (videoElement && videoElement.srcObject) {
        videoElement.srcObject.getTracks().forEach(track => (track.enabled = true));
      }
    });

    socket.on(ACTIONS.DISABLE_CAMERA, ({ peerID }) => {
      console.log(`socket on disableCamera peerID:${peerID}`);
      const videoElement = peerMediaElements.current[peerID];
      if (videoElement && videoElement.srcObject) {
        videoElement.srcObject.getTracks().forEach(track => (track.enabled = false));
      }
    });

    return () => {
      socket.off(ACTIONS.ENABLE_CAMERA);
      socket.off(ACTIONS.DISABLE_CAMERA);
    };
  }, []);


  const provideMediaRef = useCallback((id, node) => {
    peerMediaElements.current[id] = node;
  }, []);

  
  return {
    clients,
    provideMediaRef,
    enableCamera,
    disableCamera,
  };

}
