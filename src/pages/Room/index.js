import { useParams } from 'react-router';
import useWebRTC, { LOCAL_VIDEO } from '../../hooks/useWebRTC';
import socket from '../../socket';
import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { Button } from '../../components/UI';
import './Room.css';
import GameControlPanel from '../../components/GameControlPanel';
import FullscreenOverlay from '../../components/FullscreenOverlay';
import CamIsNotAllowedIcon from '../../images/icons/camisdisable.png';
import MicIsNotAllowedIcon from '../../images/icons/micisdisable.png';
import EnableCamIcon from '../../images/icons/enablecam.png';
import DisableCamIcon from '../../images/icons/disablecam.png';
import MuteMicIcon from '../../images/icons/mutemic.png';
import UnmuteMicIcon from '../../images/icons/unmutemic.png';
import { useNavigate } from 'react-router';
import CopyLinkButton from '../../components/CopyLinkButton';
const {roles,gamePhases,gameStates} = require('../../mafiavariables');
const ACTIONS = require('../../socket/actions');


export default function Room() {
  const navigate = useNavigate();
  const { id: roomID } = useParams();
  const { clients, provideMediaRef, toggleMic,toggleCam,MAtoggleMic,MAtoggleCam,
    handlePause,handleContinue,handleRestart,handleEndGame,handleStart,
     isModerator,myClientID,
     isCamAllowed,isMicAllowed,isCamEnabled,isMicEnabled,
     isRejected,
     message,remainingTime,currentTurnPlayerNumber,gamePhase,gameState,playersInfo,
     putUpForVotePlayer,myPutUpVotePlayerNumber,playersToVote,currentPlayerToVote,
    } = useWebRTC(roomID);
  const [testVideo,setTestVideo] = useState(true);
  const test = (index)=>{
    return index%2===1?'test1':'test2';
  }

  function videoLayout(){
    const defaultClassName = 'video-wrapper'
    const testClassName = ' test'
    return defaultClassName+testClassName;
  }
  // //Эксперимент
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setTestVideo(prev => !prev);
  //     console.log(`test video now: ${testVideo}`);
  //   }, 3000);
  //   return () => clearInterval(interval);
  // }, [testVideo, setTestVideo]);
  const getCamIcon = () => {
    if (!isCamAllowed) return CamIsNotAllowedIcon;
    return isCamEnabled ? EnableCamIcon : DisableCamIcon;
  };
  
  const getMicIcon = () => {
    if (!isMicAllowed) return MicIsNotAllowedIcon;
    return isMicEnabled ? UnmuteMicIcon : MuteMicIcon;
  };
  
  return testVideo?(
    <div>
      {message&&(<FullscreenOverlay bgcolor='rgba(0,0,0,0.9)'>{message}</FullscreenOverlay>)}
      {(currentPlayerToVote!==0)&&(<FullscreenOverlay bgcolor='rgba(0,0,0,0.9)'><p style={{fontSize:'24px'}}>Проголосовать за исключение игрока №{currentTurnPlayerNumber}?</p><p style={{fontSize:'24px'}}>{Object.values(playersInfo).find(player=>{return player.number===currentTurnPlayerNumber})?.name}</p><Button style={{marginTop:'20px'}}>Проголосовать!</Button></FullscreenOverlay>)}
      {isRejected&&(<FullscreenOverlay bgcolor='rgba(0,0,0,0.9)'>{isRejected}<Button style={{marginTop:'20px'}} onClick={() => {navigate(`/`);}}>Вернуться на главную</Button></FullscreenOverlay>)}
      <Navbar/>
      {isModerator&&(
      <GameControlPanel className='gc-panel'
        onStart={handleStart}
        onPause={handlePause}
        onContinue={handleContinue}
        onRestart={handleRestart}
        onEndGame={handleEndGame}
        />
        )}
      <div className='container'>
      {clients.map((clientID, index) => {
        return (
          // <div key={clientID} style={videoLayout[index]} id={clientID}>
          //сделать посишн релатив и посишн абсолют внутри управления у локал видео участника и у модератора
          
        <div  style={{display:(!playersInfo[clientID===LOCAL_VIDEO?myClientID:clientID]?.isAlive)&&gameState===gameStates.GAME_ON?'none':'block'}} key={clientID} className={videoLayout()} id={clientID}>
          <div className='player-info'>
          <p className='player-name'>Игрок {playersInfo[clientID===LOCAL_VIDEO?myClientID:clientID]?.number}.{playersInfo[clientID===LOCAL_VIDEO?myClientID:clientID]?.gender==='Мужской'?'Господин':'Госпожа'} {playersInfo[clientID===LOCAL_VIDEO?myClientID:clientID]?.name}</p>
          <p className='player-role'>{playersInfo[clientID===LOCAL_VIDEO?myClientID:clientID]?.role}</p>
          </div>
          {/* {console.log(`playersInfo:${JSON.stringify(playersInfo)}\ngameState===gameStates:${gameState===gameStates.IDLE}\ngameStates:${JSON.stringify(gameStates)}`)} */}
          <video
            width='100%'
            height='100%'
            ref={instance => provideMediaRef(clientID, instance)}
            autoPlay
            playsInline
            muted={clientID===LOCAL_VIDEO}
            style={{
              // display: test ?'none':'block' как можно выключать вебку
              display: 'block'
            }}
          />
          {(!myPutUpVotePlayerNumber)&&(playersInfo[myClientID]?.number===currentTurnPlayerNumber)&&(!(clientID===LOCAL_VIDEO))&&(!(playersInfo[clientID]?.number===0))&&(
            <Button className='put-up-for-vote-button' onClick={()=>{putUpForVotePlayer(playersInfo[clientID]?.number)}}>Выставить на голосование</Button>
            )}
          {(isModerator || clientID === LOCAL_VIDEO) && (
            <div className='video-controls'>
              <Button className='cam-button' onClick={clientID === LOCAL_VIDEO ? toggleCam : () => MAtoggleCam(clientID)}>
                <img src={getCamIcon()} alt="toggle cam"/>
              </Button>
              <Button className='mic-button' onClick={clientID === LOCAL_VIDEO ? toggleMic : () => MAtoggleMic(clientID)}>
                <img src={getMicIcon()} alt="toggle mic"/>
              </Button>
            </div>
          )}
        </div>
      );
   
      }
    )
    }
    
    <div className='video-wrapper game-info'>
    {gameState===gameStates.GAME_ON&&(<>
      <p>Таймер: <span id="timer">{remainingTime}</span></p>
      <p>Круг: 1. {gamePhase}</p>
      <p>Ход игрока: {currentTurnPlayerNumber}.{Object.values(playersInfo).find(player=>{return player.number===currentTurnPlayerNumber})?.gender==='Мужской'?'Господин ':'Госпожа '}{Object.values(playersInfo).find(player=>{return player.number===currentTurnPlayerNumber})?.name}</p>
      <p>Выставлены на голосование: {playersToVote}</p>
      <div>
          <h3>Мои заметки:</h3>
          <textarea id="notes" placeholder="Оставьте здесь свои заметки..." rows="10" cols="50"></textarea>
      </div>
      </>)}
    {gameState===gameStates.IDLE&&(<><p>Это информативный блок!</p><p>Ожидание игроков...</p><CopyLinkButton></CopyLinkButton></>)}
    {gameState===gameStates.IS_PAUSED&&(<>
      <p>Таймер: <span id="timer">Игра приостановлена</span></p>
      <p>Круг: 1. {gamePhase}</p>
      <p>Ход игрока: {currentTurnPlayerNumber}.{Object.values(playersInfo).find(player=>{return player.number===currentTurnPlayerNumber})?.gender==='Мужской'?'Господин ':'Госпожа '}{Object.values(playersInfo).find(player=>{return player.number===currentTurnPlayerNumber})?.name}</p>
      <p>Выставлены на голосование: {playersToVote}</p>
      <div>
          <h3>Мои заметки:</h3>
          <textarea id="notes" placeholder="Оставьте здесь свои заметки..." rows="10" cols="50"></textarea>
      </div></>)}
      </div>

      </div>
    </div>
  ):(
    <div>test video</div>
  );
}
