import {useEffect, useRef, useCallback, useState} from 'react';
import freeice from 'freeice';
import useStateWithCallback from './useStateWithCallback';
import socket from '../socket';
import ACTIONS from '../socket/actions';

import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { activate } from 'firebase/remote-config';
const {roles,gamePhases,gameStates} = require('../mafiavariables');

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

  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  useEffect(() => {
    const fetchUserData = async () => {
        if (user) {
            const docRef = doc(db, 'user', user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setUserData(data);
            }
        }
    };

    try {
        fetchUserData();
      } catch (e) {
        console.log(`error fetch user data: ${e}`);
    }
}, [user]);
  useEffect(()=>{
    if(userData){
      socket.emit(ACTIONS.CLIENT_INFO,
        {
          peerid:socket.id,
          userData,
        }); 
    }
  },[userData])

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
        video:true,
        // video: {
        //   width: 800,
        //   height: 600,
        //   // width: 1280,
        //   // height: 720,
        // }
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

  
  //Вывод сообщения с сервера
  const [message,setMessage] = useState('');
  useEffect(()=>{
    socket.on(ACTIONS.GAME_EVENT.MESSAGE,(({mes:message})=>{
      setMessage(message);
      setTimeout(()=>{setMessage('')},3000);
    }));
  },[message]);
  
  //Оставшееся время
  const [remainingTime,setRemainingTime] = useState(0);
  useEffect(()=>{
    socket.on(ACTIONS.GAME_EVENT.SHARE_REMAINING_TIME,({remTime:remTime})=>{
      setRemainingTime(remTime);
    });
  },[remainingTime]);
  const [currentTurnPlayerNumber,setCurrentTurnPlayerNumber] = useState(0);

  //получаем номер игрока, которого сейчас ход
  useEffect(()=>{
    socket.on(ACTIONS.GAME_EVENT.SHARE_CURRENT_TURN_PLAYER,({curTurnPlayerNumber:curTurnPlayerNumber})=>{
      setCurrentTurnPlayerNumber(curTurnPlayerNumber);
    });
  },[currentTurnPlayerNumber])
  
  //Смена фазы игры
  const [gamePhase,setGamePhase] = useState('');
  useEffect(()=>{
    socket.on(ACTIONS.GAME_EVENT.SHARE_PHASE,({phase:phase})=>{
      if(phase===gamePhases.VOTING){
        setMyVote(0);
      }
      else if(phase === gamePhases.NIGHT){
        setIsAllowedShot(true);
        setIsAllowedCheck(true);
      }
      setGamePhase(phase);
    });
  },[gamePhase]);

    //смена состояния игры
  const [gameState,setGameState] = useState('idle');
  useEffect(()=>{
    socket.on(ACTIONS.GAME_EVENT.SHARE_STATE,({state:state})=>{
      setGameState(state);});
    },[gameState])

  //получение общей информации о игроках
  const [playersInfo,setPlayersInfo] = useState({});
  useEffect(()=>{
  socket.on(ACTIONS.GAME_EVENT.SHARE_PLAYERS,({players:players})=>{
    setPlayersInfo(players);});
  },[playersInfo])

  //мой client id
  const [myClientID,setMyClientID] = useState('');
  useEffect(()=>{
    setMyClientID(socket.id);
  },[socket.id])
  
  const [myRole,setMyRole]=useState('');
  useEffect(()=>{
    setMyRole((Object.values(playersInfo).find(player=>{return player.clientID===myClientID}))?.role)
  },[myRole,playersInfo]);
  //Ночью мой выставленный игрок обнуляется
  const [myPutUpVotePlayerNumber,setMyPutUpVotePlayerNumber] = useState(0);
  useEffect(()=>{
    if(gamePhase===gamePhases.NIGHT){
      if(myRole===roles.DON||myRole===roles.SHERIFF){setIsAllowedCheck(true);}
      if(myRole===roles.DON||myRole===roles.MAFIA){setIsAllowedShot(true);}
      setMyPutUpVotePlayerNumber(0);
    }
  },[myClientID,myPutUpVotePlayerNumber,currentTurnPlayerNumber])
    
  //Выставить на голсование
  const putUpForVotePlayer = useCallback((playerNumber)=>{
    setMyPutUpVotePlayerNumber(playerNumber);
    socket.emit(ACTIONS.PLAYERS_ACTION.PUT_TO_VOTE,{playerNumber:playerNumber,roomID:roomID});
  },[myPutUpVotePlayerNumber]);
  
  const [isAllowedCheck,setIsAllowedCheck] = useState(false);
  const [isAllowedShot,setIsAllowedShot] = useState(false);
  const [isAllowedVote,setIsAllowedVote] = useState(false);
  const checkRole = useCallback((playerNumber)=>{
    socket.emit(ACTIONS.PLAYERS_ACTION.CHECK_ROLE,{roomID:roomID,playerNumber:playerNumber,clientID:socket.id});
    setIsAllowedCheck(false);
  },[isAllowedCheck]);
  const votePlayer = useCallback((playerNumber)=>{
    setIsAllowedVote(false);
    socket.emit(ACTIONS.PLAYERS_ACTION.VOTE,{roomID:roomID,playerNumber:playerNumber,clientID:socket.id});
  },[isAllowedVote]);
  const [myVote,setMyVote]=useState(0);
  useEffect(()=>{
    const shareMyVoteHandler = (playerNumber)=>{
      setMyVote(playerNumber);
    }
    socket.on(ACTIONS.GAME_EVENT.SHARE_MY_VOTE,shareMyVoteHandler);
  },[myVote]);
  const mafiaShot = useCallback((playerNumber)=>{
    setIsAllowedShot(false);
    socket.emit(ACTIONS.PLAYERS_ACTION.MAFIA_SHOT,{roomID:roomID,playerNumber:playerNumber,clientID:socket.id});
  },[]);

  //Получение списка игроков выставленных на голосование
  const[playersToVote,setPlayersToVote] = useState([]);
  useEffect(()=>{
    socket.on(ACTIONS.GAME_EVENT.SHARE_PUT_UP_FOR_VOTE,({playersToVote:playersToVote})=>{
      let stringPlayersToVote = '';
      playersToVote.forEach(player=>{
        stringPlayersToVote = stringPlayersToVote+player+' ';
      })
      setPlayersToVote(stringPlayersToVote);
    })
  },[playersToVote]);
  
  //Получаем текущего игрока за которого мы голосуем
  const[currentPlayerToVote,setCurrentPlayerToVote] = useState(0);
  useEffect(()=>{
    socket.on(ACTIONS.GAME_EVENT.VOTE_FOR_THE_PLAYER,({playerToVote:playerToVote})=>{
      setCurrentPlayerToVote(playerToVote);
    });
  },[currentPlayerToVote]);

  // const[canCheck,setCanCheck] = useState(0);
  // useEffect(()=>{
    
  // },[canCheck]);
  // checkRole = useCallback((playerNumber)=>{
  //   socket.emit(ACTIONS.PLAYERS_ACTION.CHECK_ROLE,{playerNumber:playerNumber});
  // },[canCheck]);
  // const[canShot,setCanShot] = useState(true);


  const [isCamAllowed,setIsCamAllowed] = useState(true);
  const [isMicAllowed,setIsMicAllowed] = useState(true);
  const [isCamEnabled,setIsCamEnabled] = useState(true);
  const [isMicEnabled,setIsMicEnabled] = useState(true);
  const [isCamPermitted,setIsCamPermitted] = useState(true);
  const [isMicPermitted,setIsMicPermitted] = useState(true);
  const [isRejected,setIsRejected] = useState('');
  // Добавляем useEffect для обработки включения/выключения камеры/микрофона
    const disableMyCamToAll = () =>{
      const videoTrack = localMediaStream.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = false;
        Object.keys(peerConnections.current).forEach(peerID => {
          const peerConnection = peerConnections.current[peerID];
          const sender = peerConnection.getSenders().find(s => s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });
      }
    }
    const  disableMyMicToAll = () =>{
      const audioTrack = localMediaStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = false;
        Object.keys(peerConnections.current).forEach(peerID => {
          const peerConnection = peerConnections.current[peerID];
          const sender = peerConnection.getSenders().find(s => s.track.kind === 'audio');
          if (sender) {
            sender.replaceTrack(audioTrack);
          }
        });
      }
    }

    const enableMyCamToAll = () =>{
      const videoTrack = localMediaStream.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = true;
        Object.keys(peerConnections.current).forEach(peerID => {
          const peerConnection = peerConnections.current[peerID];
          const sender = peerConnection.getSenders().find(s => s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });
      }
    }
    const enableMyMicToAll = () =>{
      const audioTrack = localMediaStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = true;
        Object.keys(peerConnections.current).forEach(peerID => {
          const peerConnection = peerConnections.current[peerID];
          const sender = peerConnection.getSenders().find(s => s.track.kind === 'audio');
          if (sender) {
            sender.replaceTrack(audioTrack);
          }
        });
      }
    }

    const disableMyCamToSingle = (peerID) =>{
      const videoTrack = localMediaStream.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = false;
          const peerConnection = peerConnections.current[peerID];
          const sender = peerConnection.getSenders().find(s => s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
      }
    }
    const  disableMyMicToSingle = (peerID) =>{
      const audioTrack = localMediaStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = false;
          const peerConnection = peerConnections.current[peerID];
          const sender = peerConnection.getSenders().find(s => s.track.kind === 'audio');
          if (sender) {
            sender.replaceTrack(audioTrack);
          }
      }
    }

    const enableMyCamToSingle = (peerID) =>{
      const videoTrack = localMediaStream.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = true;
          const peerConnection = peerConnections.current[peerID];
          const sender = peerConnection.getSenders().find(s => s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
      }
    }
    const enableMyMicToSingle = (peerID) =>{
      const audioTrack = localMediaStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = true;
          const peerConnection = peerConnections.current[peerID];
          const sender = peerConnection.getSenders().find(s => s.track.kind === 'audio');
          if (sender) {
            sender.replaceTrack(audioTrack);
          }
      }      
    }

    
  const moderatorChangedMicAllow = useCallback(()=>{
    if(isMicAllowed){
      disableMyMicToAll();
      setIsMicEnabled(false);
    }
    setIsMicAllowed(prev=>!prev);    
  },[isMicAllowed]);
  
  const moderatorChangedCamAllow = useCallback(()=>{
    if(isCamAllowed){
      disableMyCamToAll();
      setIsCamEnabled(false);
    }
    setIsCamAllowed(prev=>!prev);    
  },[isCamAllowed]);

  useEffect(() => {
    socket.on(ACTIONS.SET_MODERATOR, ({ isModerator }) => {
      setIsModerator(isModerator);
    });

    socket.on(ACTIONS.MODERATOR_ACTION, ({ action }) => {
      // Handle actions for toggling mic, camera, etc.
      console.log(`Action from moderator: ${action}`);
      if(action===ACTIONS.MA.CHANGE_PLAYER_CAM_ALLOW){
        moderatorChangedCamAllow()
      }
      if(action===ACTIONS.MA.CHANGE_PLAYER_MIC_ALLOW){
        moderatorChangedMicAllow();
      }
    });

    return () => {
      socket.off(ACTIONS.SET_MODERATOR);
      socket.off(ACTIONS.MODERATOR_ACTION);
    };
  }, []);
  
  useEffect(()=>{
    socket.on(ACTIONS.KICK,(reason)=>{
      setIsRejected(reason);
      if (localMediaStream.current) {
      localMediaStream.current.getTracks().forEach(track => track.stop());
    }
      socket.emit(ACTIONS.LEAVE);
    });
  });


  const MAtoggleMic = useCallback((peerID)=>{
    socket.emit(ACTIONS.MODERATOR_ACTION, {targetClientID:peerID,action: ACTIONS.MA.CHANGE_PLAYER_MIC_ALLOW} )
},[])

  const MAtoggleCam = useCallback((peerID)=>{
    socket.emit(ACTIONS.MODERATOR_ACTION, {targetClientID:peerID,action: ACTIONS.MA.CHANGE_PLAYER_CAM_ALLOW} )
  },[])

  const handlePause = useCallback(()=>{
    socket.emit(ACTIONS.MODERATOR_ACTION, {targetClientID:'all',action: ACTIONS.MA.PAUSE_GAME} )
  },[])
  const handleContinue = useCallback(()=>{
    socket.emit(ACTIONS.MODERATOR_ACTION, {targetClientID:'all',action: ACTIONS.MA.RESUME_GAME} )
  },[])
  const handleFastBackward = useCallback(()=>{
    socket.emit(ACTIONS.MODERATOR_ACTION, {targetClientID:'all',action:ACTIONS.MA.FAST_BACKWARD});
  },[])
  const handleFastForward = useCallback(()=>{
    console.log(`fastfw client`);
    socket.emit(ACTIONS.MODERATOR_ACTION, {targetClientID:'all',action:ACTIONS.MA.FAST_FORWARD});
  },[])
  const handleStart = useCallback(()=>{
    socket.emit(ACTIONS.MODERATOR_ACTION, {targetClientID:'all',action: ACTIONS.MA.START_GAME} )
  },[])
  const handleRestart = useCallback(()=>{
    socket.emit(ACTIONS.MODERATOR_ACTION, {targetClientID:'all',action: ACTIONS.MA.RESTART_GAME} )
  },[])
  const handleEndGame = useCallback(()=>{
    socket.emit(ACTIONS.MODERATOR_ACTION, {targetClientID:'all',action: ACTIONS.MA.FINISH_GAME} )
  },[])

  const toggleMic = useCallback(()=>{
    if(!isMicEnabled&&isMicAllowed&&isMicPermitted){
      enableMyMicToAll()
    }
    isMicEnabled&&disableMyMicToAll();
    setIsMicEnabled(prev=>!prev);    
  },[isMicEnabled,isMicAllowed,isMicPermitted]);
  
  const toggleCam = useCallback(()=>{
    if(!isCamEnabled&&isCamAllowed&&isCamPermitted){
      enableMyCamToAll();
    }
    isCamEnabled&&disableMyCamToAll();
    setIsCamEnabled(prev=>!prev);    
  },[isCamEnabled,isCamAllowed,isCamPermitted]);


  const provideMediaRef = useCallback((id, node) => {
    peerMediaElements.current[id] = node;
  }, [peerMediaElements]);
  //test
  return {
    clients,
    provideMediaRef,
    toggleMic,toggleCam,
    MAtoggleMic,MAtoggleCam,
    handlePause,handleContinue,handleFastBackward,handleFastForward,handleRestart,handleEndGame,handleStart,
    isModerator,myClientID,
    isCamAllowed,
    isMicAllowed,
    isCamEnabled,
    isMicEnabled,
    isRejected,
    message,remainingTime,currentTurnPlayerNumber,gamePhase,gameState,playersInfo,
    putUpForVotePlayer,myPutUpVotePlayerNumber,playersToVote,currentPlayerToVote,
    checkRole, mafiaShot, votePlayer,myVote,myRole,
    isAllowedCheck,isAllowedShot,isAllowedVote,
    // canCheck,canShot,
  };

}
