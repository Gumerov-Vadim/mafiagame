import { useEffect, useState, useRef } from "react";
import { useNavigate } from 'react-router';
import ACTIONS from "../../socket/actions";
import { v4 } from 'uuid';
import socket from "../../socket";
import Navbar from "../../components/Navbar";
import {Button} from '../../components/UI';

export default function Main() {
    const navigate = useNavigate();
    const [rooms, updateRooms] = useState([]);
    const rootNode = useRef();
  

    useEffect(() => {
        //Обновляем комнаты, когда они меняются
        socket.on(ACTIONS.SHARE_ROOMS, ({rooms = []} = {}) => {
            if(rootNode.current){
            updateRooms(rooms);
            }
        });
      }, []);


    return (
        <div ref={rootNode}>
                
             <Navbar/>
             <h1>
                Available Rooms
            </h1>
            <ul>
                {rooms.map(roomID => (
                    <li key={roomID}>
                        {roomID}
                        <Button onClick={() => {
                            navigate(`/room/${roomID}`);
                        }}>
                            JOIN ROOM
                        </Button>
                    </li>
                ))}
            </ul>
            {console.log(`rooms info:${rooms}`)}
            <Button onClick={() => {
                navigate(`/room/${v4()}`);
            }}>
                Create New Room
            </Button>
        </div>
    );
}
