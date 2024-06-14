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
let usersData = {};
let playersInfo = {};
let gamesInfo = {};
const roles = {
  MAFIA: 'mafia',
  CITITZEN: 'citizen',
  SHERIFF: 'sheriff',
  DON:'don',
}
const gameStates = {
  IDLE:'idle',
  IS_PAUSED: 'is-paused',
  GAME_ON: 'game-on',
}
const gamePhases = {
  DAY:'day',
  NIGHT: 'night',
  VOTING: 'voting',
}
//usersNumber
//usersRole

//setInterval (gameloop,-1 sek)
function getClientByMail(mail){
  return playersInfo[mail].client;
}
function getMailByClient(client){
  try{
  return usersData[client].email}
  catch(e){
    console.log(`Не могу получить mail пользователя ${client},\n${e}`);
  };
}
function FisherYatesShuffle(list){
  const length = list.length;
  for (let i=0;i<length;i++){
    let currentObj = list[i];
    let swappedObjIndex = Math.floor(Math.random()*(length-1));
    list[i] = list[swappedObjIndex];
    list[swappedObjIndex] = currentObj;
  }
  return list;
}
function getListOfRandomNums(countOfPlayers){
  let listOfRandomNums = [];
  for(let i=0;i<countOfPlayers;i++){
    listOfRandomNums.push(i+1);
  }
  listOfRandomNums = FisherYatesShuffle(listOfRandomNums);
  return listOfRandomNums;
}
function getListOfRoles(countOfPlayers){
  if (countOfPlayers<7||countOfPlayers>12) {return []}
  
  const countOfMafia = Math.ceil(countOfPlayers/3)-1;
  const countOfCitizen = countOfPlayers - countOfMafia - 1 - 1;
  let listOfRoles = [];
  for(let i = 0;i<countOfMafia;i++){
    listOfRoles.push(roles.MAFIA);
  }
  for(let i = 0;i<countOfCitizen;i++){
    listOfRoles.push(roles.CITITZEN);
  }
  listOfRoles.push(roles.DON);
  listOfRoles.push(roles.SHERIFF);
  listOfRoles = FisherYatesShuffle(listOfRoles);
  return listOfRoles;
}
function initGame(roomID,clients){
  console.log('код здесь');
  if(gamesInfo[roomID]){return};
  const moderator = clients.find(client=>roomModerators[roomID] === client);
  let listOfRandomNums = getListOfRandomNums(clients.length-1);
  let listOfRoles = getListOfRoles(clients.length-1);
  clients.forEach(client=>{
    const mail = getMailByClient(client);
    playersInfo[mail] = {
      clientID:client,
      role:(client===moderator)?moderator:listOfRoles.pop(),
      number:(client===moderator)?0:listOfRandomNums.pop(),
      isCamPermit: true,
      isMicPermit: true,
      isAlive:true,
    }
  })
  
  gamesInfo[roomID] = {
      moderator:moderator,
      gameState: gameStates.GAME_ON,
      gamePhase:gamePhases.NIGHT,
      circleCount:0,
      deadList:[],
      SheriffsChecks:[],
      DonsChecks:[],
  }
}

io.on('connection', socket => {

  //При подключении делимся со всеми сокета информацией о комнатах.
  console.log("Socket connected!");
  setTimeout(shareRoomsInfo, 1000);
  socket.on(ACTIONS.JOIN, config => {
    const {room: roomID} = config; //Получаем комнату из конфига
    const {rooms: joinedRooms} = socket; //Получаем список всех комнат
    //Ошибка, если уже подключились к этой комнате
    if (Array.from(joinedRooms).includes(roomID)) {
      return console.warn(`Already joined to ${roomID}`);
    } 
    //Получаем всех клиентов из этой комнаты
    const clients = Array.from(io.sockets.adapter.rooms.get(roomID) || []);

    //Каждому клиенту передаём подключение
    clients.forEach(clientID => {
      //Клиенты, которые уже подлючены оффер не создают
      io.to(clientID).emit(ACTIONS.ADD_PEER, {
        peerID: socket.id,
        createOffer: false
      });
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

    //Получаем всех клиентов из этой комнаты
      const clients = Array.from(io.sockets.adapter.rooms.get(roomID) || []);
    if (!roomID) {
      return console.warn('Only the moderator can perform this action');
    }
    if(targetClientID==='all'){
      switch(action){
        case ACTIONS.MA.START_GAME:
          startGame(roomID,clients);
          break;
        case ACTIONS.MA.RESTART_GAME:
          restartGame(roomID);
          break;
        case ACTIONS.MA.PAUSE_GAME:
          pauseGame(roomID);
          break;
        case ACTIONS.MA.RESUME_GAME:
          resumeGame(roomID);
          break;
        case ACTIONS.MA.FINISH_GAME:
          finishGame(roomID,clients);
          break;
      }
      clients.forEach(clientID=>{
        io.to(clientID).emit(ACTIONS.MODERATOR_ACTION, {action});
      })
    }
    else{
    io.to(targetClientID).emit(ACTIONS.MODERATOR_ACTION, { action });
    }
  });
  
function startGame(roomID, clients){
  
  initGame(roomID,clients);
  //emit уведомление о ролях
  //timeout emit на включение вебок для мафии
  //timeout emit на выключение.
}

function restartGame(roomID){
  finishGame(roomID);
  startGame(roomID);
}

function pauseGame(roomID){
  //clearInterval gameloop
}

function resumeGame(roomID){
  //Interval gameloop
}

function finishGame(roomID,clients){
  console.log(`playersInfo:${JSON.stringify(playersInfo)}\ngamesInfo:${JSON.stringify(gamesInfo)}`);
  clients.forEach(client=>{
    delete playersInfo[getMailByClient(client)];
  });
  delete gamesInfo[roomID];
  console.log(`playersInfo:${JSON.stringify(playersInfo)}\ngamesInfo:${JSON.stringify(gamesInfo)}`);
  //emit уведомление о завершении
  //delete users role, number, data и прочее...
}

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
            console.log(roomModerators[roomID]);
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
  socket.on(ACTIONS.CLIENT_INFO,({peerid,userData})=>{
    // Проверка, существует ли email
    let emailExists = false;
  
    for (let key in usersData) {
      if (usersData[key].email === userData.email) {
        emailExists = true;
        break;
      }
    }
  
    if (!emailExists) {
      // Если email не найден, добавляем новую запись
      usersData[peerid] = userData;
      console.log('New user added:', usersData);
    } else {
      console.log(`\nTO DO!\nобработать повторное подключение пользователя, который уже зашёл!\n`);
      console.log('\nusersData:', usersData);
      //TO DO
      //обработать повторное подключение пользователя, который уже зашёл
      //https://upgraide.me/chat?id=330a3c31-25b8-11ef-b1f4-0242c0a8800d
    }  
  })
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