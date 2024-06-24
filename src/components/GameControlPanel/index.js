import React, { useState } from 'react';
import './GameControlPanel.css';
import unfoldIcon from '../../images/icons/unfold.png';
import rollupIcon from '../../images/icons/rollup.png';
import pauseIcon from '../../images/icons/pause.png';
import fastforwardIcon from '../../images/icons/fastforward.png';
import fastbackwardIcon from '../../images/icons/fastbackward.png';
import continueIcon from '../../images/icons/continue.png';
import restartIcon from '../../images/icons/restart.png';
import exitIcon from '../../images/icons/exit.png';
import { Button } from '../UI';

const GameControlPanel = ({
  onStart,
  onPause,
  onContinue,
  onFastBackward,
  onFastForward,
  onRestart,
  onEndGame,
  children,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const handleStart = () => {
    console.log('Game started!');
    setIsGameStarted(true);
    onStart?.();
  };
  const handlePause = () => {
    console.log('Game paused!');
    setIsPaused(true);
    onPause?.();
  };

  const handleContinue = () => {
    console.log('Game continued!');
    setIsPaused(false);
    onContinue?.();
  };
const handleFastBackward = ()=>{
  console.log('Game FastBackWard!');
  onFastBackward?.();
};
const handleFastForward = ()=>{
  console.log('Game FastFastWard!');
  onFastForward?.();
};
  const handleRestart = () => {
    console.log('Game restarted!');
    setIsPaused(false);
    onRestart?.();
  };

  const handleEndGame = () => {
    console.log('Game ended!');
    setIsGameStarted(false);
    onEndGame?.();
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div {...props}>
      <Button className="toggle-visibility" onClick={toggleVisibility}>
        <img src={isVisible ? rollupIcon : unfoldIcon} alt={isVisible ? 'Rollup' : 'Unfold'} />
      </Button>
      {isVisible && (
        <div className="buttons">
          {isGameStarted?(
          <>
          {!isPaused ? (
            <>
              <Button onClick={handlePause} title="Pause">
                <img src={pauseIcon} alt="Pause"/>
              </Button>
              <Button onClick={handleFastBackward} title="Fast Backward">
                <img src={fastbackwardIcon} alt="Fast backward"/>
              </Button>
              <Button onClick={handleFastForward} title="Fast Forward">
                <img src={fastforwardIcon} alt="Fast Forward"/>
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleContinue} title="Continue">
                <img src={continueIcon} alt="Continue"/>
              </Button>
              <Button onClick={handleRestart} title="Restart">
                <img src={restartIcon} alt="Restart"/>
              </Button>
              <Button onClick={handleEndGame} title="End Game">
                <img src={exitIcon} alt="End Game"/>
              </Button>
            </>
          )}
          </>
          ):(
          <>
          <Button onClick={handleStart} title="Start">
            [ Начать игру ]
          </Button>
          </>
        )}
          {children}
        </div>
      )}
    </div>
  );
};

export default GameControlPanel;