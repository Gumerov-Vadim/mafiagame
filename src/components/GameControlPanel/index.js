import React, { useState } from 'react';
import './GameControlPanel.css';
import unfoldIcon from '../../images/icons/unfold.png';
import rollupIcon from '../../images/icons/rollup.png';
import pauseIcon from '../../images/icons/pause.png';
import fastforwardIcon from '../../images/icons/fastforward.png';
import continueIcon from '../../images/icons/continue.png';
import restartIcon from '../../images/icons/restart.png';
import exitIcon from '../../images/icons/exit.png';
import { Button } from '../UI';

const GameControlPanel = ({
  onPause,
  onContinue,
  onRestart,
  onEndGame,
  children,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

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

  const handleRestart = () => {
    console.log('Game restarted!');
    onRestart?.();
  };

  const handleEndGame = () => {
    console.log('Game ended!');
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
          {!isPaused ? (
            <>
              <Button onClick={handlePause} title="Pause">
                <img src={pauseIcon} alt="Pause"/>
              </Button>
              <Button title="Fast Forward">
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
          {children}
        </div>
      )}
    </div>
  );
};

export default GameControlPanel;