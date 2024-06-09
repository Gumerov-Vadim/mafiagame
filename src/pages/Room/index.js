import { useParams } from 'react-router';
import useWebRTC, { LOCAL_VIDEO } from '../../hooks/useWebRTC';
import socket from '../../socket';
import { useState } from 'react';
import Navbar from '../../components/Navbar';
import { Button } from '../../components/UI';
import './Room.css';
import GameControlPanel from '../../components/GameControlPanel';
import CamIsNotAllowedIcon from '../../images/icons/camisdisable.png';
import MicIsNotAllowedIcon from '../../images/icons/micisdisable.png';
import EnableCamIcon from '../../images/icons/enablecam.png';
import DisableCamIcon from '../../images/icons/disablecam.png';
import MuteMicIcon from '../../images/icons/mutemic.png';
import UnmuteMicIcon from '../../images/icons/unmutemic.png';
const ACTIONS = require('../../socket/actions');


export default function Room() {
  const { id: roomID } = useParams();
  const { clients, provideMediaRef, isModerator, playersInfo } = useWebRTC(roomID);
  
  const [isCamAllowed,setIsCamAllowed] = useState(true);
  const [isMicAllowed,setIsMicAllowed] = useState(true);
  const [isCamEnabled,setIsCamEnabled] = useState(true);
  const [isMicEnabled,setIsMicEnabled] = useState(true);
  const test = (index)=>{
    return index%2===1?'test1':'test2';
  }

  function videoLayout(){
    const defaultClassName = 'video-wrapper'
    const testClassName = ' test'
    return defaultClassName+testClassName;
  }

  const handlePause = () => {
    // Логика обработки паузы в родительском компоненте
    console.log('Pause event from GameControlPanel');
  };

  const handleContinue = () => {
    // Логика обработки продолжения в родительском компоненте
    console.log('Continue event from GameControlPanel');
  };

  const handleRestart = () => {
    // Логика обработки рестарта в родительском компоненте
    console.log('Restart event from GameControlPanel');
  };

  const handleEndGame = () => {
    // Логика обработки завершения игры в родительском компоненте
    console.log('End game event from GameControlPanel');
  };

  
  return (
    <div>
      <Navbar/>
      <GameControlPanel className='gc-panel'
        onPause={handlePause}
        onContinue={handleContinue}
        onRestart={handleRestart}
        onEndGame={handleEndGame}
        />
      <div className='container'>
      {clients.map((clientID, index) => {
        return (
          // <div key={clientID} style={videoLayout[index]} id={clientID}>
          //сделать посишн релатив и посишн абсолют внутри управления у локал видео участника и у модератора
        <div key={clientID} className={videoLayout()} id={clientID}>
          <div className='player-info'>
          <p className='player-name'>Игрок 1.Господин Мустафа</p>
          <p className='player-role'>МАФИЯ</p>
          </div>
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
          {isModerator && clientID !== LOCAL_VIDEO && (
            <div className='video-controls'>
                  {isCamAllowed?(
                  <>
                    <Button className='cam-button'><img src={isCamEnabled?EnableCamIcon:DisableCamIcon} alt="toggle cam"/></Button>
                      </>):(<>
                    <Button className='cam-button'><img src={CamIsNotAllowedIcon} alt="Cam is not allowed"/></Button>
                      
                      </>)}
                  {isMicAllowed?(
                  <>
                    <Button className='mic-button'><img src={isMicEnabled?UnmuteMicIcon:MuteMicIcon} alt="toggle mic"/></Button>
                      </>):(<>
                    <Button className='mic-button'><img src={MicIsNotAllowedIcon} alt="Mic is not allowed"/></Button>
                      
                      </>)}
            </div>
          )}
        </div>
      );
   
      }
    )
    }
    
    <div className='video-wrapper game-info'>
    <p>Таймер: <span id="timer">00:00</span></p>
    <p>Круг: 1. День</p>
    <p>Ход игрока: 1. Господин Мустафа</p>
    <p>Выставлены на голосование: 1, 2, 5</p>
    <div>
        <h3>Мои заметки:</h3>
        <textarea id="notes" placeholder="Оставьте здесь свои заметки..." rows="10" cols="50"></textarea>
    </div>
    </div>

    </div>
    </div>
  );
}
