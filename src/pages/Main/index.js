import { useEffect, useState } from "react";
import {useNavigate} from 'react-router';
import ACTIONS from "../../socket/actions";
import {v4} from 'uuid';
import socket from "../../socket";
export default function Main(){
    const navigate = useNavigate();
    const [rooms, updateRooms] = useState([]);

    useEffect(()=>{
        socket.on(ACTIONS.SHARE_ROOMS,({rooms=[]}={})=>{
            updateRooms(rooms);
        });
    },[]);

    return(
        <div>
            <h1>
                Availabele Rooms
            </h1>
            <ul>
                {rooms.map(roomID=>(
                    <li key={roomID}>
                        {roomID}
                        <button onClick={()=>{
                            navigate(`/room/${roomID}`);
                        }}>
                            JOIN ROOM
                        </button>
                    </li>
                ))}
            </ul>
            <button onClick={()=>{
                navigate(`/room/${v4()}`);
            }}>
                Create New Room
            </button>
        </div>
    );
}