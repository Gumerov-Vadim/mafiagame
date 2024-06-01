import { useParams } from 'react-router';
import useWebRTC, { LOCAL_VIDEO } from '../../hooks/useWebRTC';
import socket from '../../socket';
import { useState } from 'react';
const ACTIONS = require('../../socket/actions');

function layout(clientsNumber = 1) {
  const pairs = Array.from({ length: clientsNumber }).reduce((acc, next, index, arr) => {
    if (index % 2 === 0) {
      acc.push(arr.slice(index, index + 2));
    }
    return acc;
  }, []);
  const rowsNumber = pairs.length;
  const height = `${100 / rowsNumber}%`;
  return pairs.map((row, index, arr) => {
    if (index === arr.length - 1 && row.length === 1) {
      return [{ width: '100%', height }];
    }
    return row.map(() => ({ width: '50%', height }));
  }).flat();
}

export default function Room() {
  const { id: roomID } = useParams();
  const { clients, provideMediaRef, isModerator } = useWebRTC(roomID);
  const videoLayout = layout(clients.length);
  console.log(`Room clients :${clients}`);
    const toggleMic = (clientID) => {
    socket.emit(ACTIONS.MODERATOR_ACTION, { targetClientID: clientID, action: 'toggleMic' });
  };
  const [disabledvideo, setdisabledvideo] = useState([]);
  const toggleCamera = (clientID) => {
    disabledvideo.includes(clientID)? setdisabledvideo(disabledvideo.filter(id => id !== clientID)):setdisabledvideo([...disabledvideo, clientID]);
    socket.emit(ACTIONS.MODERATOR_ACTION, { targetClientID: clientID, action: 'toggleCamera' });
  };

  const isVideoDisabled = (clientID) => {
    return disabledvideo.includes(clientID);
  }
  const isMuted = (clientID) => {
    return clientID === LOCAL_VIDEO;
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', height: '100vh' }}>
      {clients.map((clientID, index) => {
        // const test = false; как можно выключать вебку
        if(!isVideoDisabled(clientID)){
        return (
        <div key={clientID} style={videoLayout[index]} id={clientID}>
          <video
            width='100%'
            height='100%'
            ref={instance => provideMediaRef(clientID, instance)}
            autoPlay
            playsInline
            muted={isMuted(clientID)}
            style={{
              // display: test ?'none':'block' как можно выключать вебку
              display: 'block'
            }}
          />
           {isModerator && clientID !== LOCAL_VIDEO && (
            <div>
              <button onClick={() => toggleMic(clientID)}>Toggle Mic</button>
              <button onClick={() => toggleCamera(clientID)}>Toggle Camera</button>
            </div>
          )}
        </div>
      );
    }
    else{
      
      return (
        <div key={clientID} style={videoLayout[index]} id={clientID}>
          <audio
            width='100%'
            height='100%'
            ref={instance => provideMediaRef(clientID, instance)}
            autoPlay
            playsInline
            muted={isMuted(clientID)}
            style={{
              // display: test ?'none':'block' как можно выключать вебку
              display: 'block'
            }}
          />
           {isModerator && clientID !== LOCAL_VIDEO && (
            <div>
              <button onClick={() => toggleMic(clientID)}>Toggle Mic</button>
              <button onClick={() => toggleCamera(clientID)}>Toggle Camera</button>
            </div>
          )}
        </div>
      );
    }
      })
    }
    </div>
  );
}
