import { useEffect, useState, useRef } from "react";
import { useNavigate } from 'react-router';
import ACTIONS from "../../socket/actions";
import { v4 } from 'uuid';
import socket from "../../socket";

export default function Main() {
    const navigate = useNavigate();
    const [rooms, updateRooms] = useState([]);
    const rootNode = useRef();
  
    useEffect(() => {
        //Обновляем комнаты, когда они меняются
        socket.on(ACTIONS.SHARE_ROOMS, ({rooms = []} = {}) => {
            console.log("test12345");
            if(rootNode.current){
            updateRooms(rooms);
            }
        });
      }, []);

    return (
        <div>
            <h1>
                Available Rooms
            </h1>
            <ul>
                {rooms.map(roomID => (
                    <li key={roomID}>
                        {roomID}
                        <button onClick={() => {
                            navigate(`/room/${roomID}`);
                        }}>
                            JOIN ROOM
                        </button>
                    </li>
                ))}
            </ul>
            <button onClick={() => {
                navigate(`/room/${v4()}`);
            }}>
                Create New Room
            </button>
        </div>
    );
}
