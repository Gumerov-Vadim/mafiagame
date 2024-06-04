const path = require('path');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const {version, validate} = require('uuid');

const ACTIONS = require('./src/socket/actions');
const PORT = process.env.PORT || 3001;

//Возвращает список всех комнат, которые сущестувют
function getClientRooms() {
  const {rooms} = io.sockets.adapter;

  return Array.from(rooms.keys()).filter(roomID => validate(roomID) && version(roomID) === 4);
}

//Функция, которая делится с пользователем списком всех доступных комнат.
function shareRoomsInfo() {
  io.emit(ACTIONS.SHARE_ROOMS, {
    rooms: getClientRooms()
  })
}
let roomModerators = {};

io.on('connection', socket => {

  //При подключении делимся со всеми сокета информацией о комнатах.
  console.log("Socket connected!");
  setTimeout(shareRoomsInfo, 1000);
  socket.on(ACTIONS.JOIN, config => {
    const {room: roomID} = config; //Получаем комнату из конфига
    // {
    //   const clients = Array.from(io.sockets.adapter.rooms.get(roomID) || []);
    //   socket.emit(ACTIONS.TEST, {clients, roomID});
    // }
    const {rooms: joinedRooms} = socket; //Получаем список всех комнат
    // console.log(`joinedRooms:${joinedRooms}\nroomID:${roomID}`);
    // joinedRooms.forEach(room => {
    //   console.log(`\nroom:${room}`);      
    // });
    //Ошибка, если уже подключились к этой комнате
    if (Array.from(joinedRooms).includes(roomID)) {
      return console.warn(`Already joined to ${roomID}`);
    } 
    console.log("test");
    //Получаем всех клиентов из этой комнаты
    const clients = Array.from(io.sockets.adapter.rooms.get(roomID) || []);

    //Каждому клиенту передаём подключение
    clients.forEach(clientID => {
      //Клиенты, которые уже подлючены оффер не создают
      io.to(clientID).emit(ACTIONS.ADD_PEER, {
        peerID: socket.id,
        createOffer: false
      });
      console.log(`========\nclientID:${clientID}\nsocket.id:${socket.id}`);
      //Оффер создаёт сторона, которая подключается
      socket.emit(ACTIONS.ADD_PEER, {
        peerID: clientID,
        createOffer: true,
      });
    });

    //Подключение к комнате
    socket.join(roomID);

      // Assign the first user who joins as the moderator.
      if (!roomModerators[roomID]) {
        roomModerators[roomID] = socket.id;
        socket.emit(ACTIONS.SET_MODERATOR, { isModerator: true });
      } else {
        socket.emit(ACTIONS.SET_MODERATOR, { isModerator: false });
      }

    //Делимся информацией о новом состоянии комнат с пользователями
    shareRoomsInfo();
  });

  socket.on(ACTIONS.MODERATOR_ACTION, ({ targetClientID, action }) => {
    const { rooms } = socket;
    const roomID = Array.from(rooms).find(roomID => roomModerators[roomID] === socket.id);

    if (!roomID) {
      return console.warn('Only the moderator can perform this action');
    }
    console.log(`action:${action}\ntargetClientID:${targetClientID}`);
    io.to(targetClientID).emit(ACTIONS.MODERATOR_ACTION, { action, targetClientID});
  });
  //Функция для выхода из комнаты
  function leaveRoom() {
    console.log("Socket disconnected!");
    const {rooms} = socket;

    Array.from(rooms)
      // LEAVE ONLY CLIENT CREATED ROOM
      .filter(roomID => validate(roomID) && version(roomID) === 4)
      .forEach(roomID => {

        const clients = Array.from(io.sockets.adapter.rooms.get(roomID) || []);

        //Отправляем всем клиентам ивент о отключении соединения
        clients
          .forEach(clientID => {
          io.to(clientID).emit(ACTIONS.REMOVE_PEER, {
            //Отправляем свой soket.id
            peerID: socket.id,
          });

          //Самому себе отправляем id клиента, чтобы отключится от остальных
          socket.emit(ACTIONS.REMOVE_PEER, {
            peerID: clientID,
          });
        });

        if (roomModerators[roomID] === socket.id) {
          delete roomModerators[roomID];
          if (clients.length > 1) {
            const newModeratorID = clients.find(id => id !== socket.id);
            roomModerators[roomID] = newModeratorID;
            io.to(newModeratorID).emit(ACTIONS.SET_MODERATOR, { isModerator: true });
          }
        }
        //Покидаем комнату
        socket.leave(roomID);
      });

      //Делимся с клиентами новым состоянием комнат
    shareRoomsInfo();
  }

  socket.on(ACTIONS.LEAVE, leaveRoom);
  socket.on('disconnecting', leaveRoom);

  //Получение SDP
  socket.on(ACTIONS.RELAY_SDP, ({peerID, sessionDescription}) => {
    //отправляем конкретному сокету
    io.to(peerID).emit(ACTIONS.SESSION_DESCRIPTION, {
      peerID: socket.id, //от кого
      sessionDescription, //sessionDescription
    });
  });

  //Получение ICE
  socket.on(ACTIONS.RELAY_ICE, ({peerID, iceCandidate}) => {
    //отправляем конкретному сокету
    io.to(peerID).emit(ACTIONS.ICE_CANDIDATE, {
      peerID: socket.id,//от кого
      iceCandidate, //ICE
    });
  });

  socket.on(ACTIONS.ENABLE_CAMERA, ({ peerID }) => {
    io.emit(ACTIONS.ENABLE_CAMERA, { peerID });
  });

  socket.on(ACTIONS.DISABLE_CAMERA, ({ peerID }) => {
    io.emit(ACTIONS.DISABLE_CAMERA, { peerID });
  });
});

const publicPath = path.join(__dirname, 'build');

app.use(express.static(publicPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

server.listen(PORT, () => {
  console.log('Server Started!')
})