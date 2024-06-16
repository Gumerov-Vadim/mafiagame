const path = require('path');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const {version, validate} = require('uuid');
const {roles,gamePhases,gameStates} = require('./src/mafiavariables');

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
let players = {};
let games = {};

//setInterval (gameloop,-1 sek)
function getClientByMail(mail){
  return players[mail].client;
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
  if(games[roomID]){return};
  const moderator = clients.find(client=>roomModerators[roomID] === client);
  let listOfRandomNums = getListOfRandomNums(clients.length-1);
  let listOfRoles = getListOfRoles(clients.length-1);
  clients.forEach(client=>{
    const mail = getMailByClient(client);
    players[mail] = {
      clientID:client,
      role:(client===moderator)?roles.GAME_MASTER:listOfRoles.pop(),
      number:(client===moderator)?0:listOfRandomNums.pop(),
      isCamPermit: true,
      isMicPermit: true,
      isAlive:true,
      votedIn:[],
    }
  })
  
  games[roomID] = {
      moderator:moderator,
      remainingTime:60,
      state: gameStates.GAME_ON,
      phase:gamePhases.NIGHT,
      circleCount:0,
      currentTurnPlayer:1,
      deadList:[],
      SheriffsChecks:[],
      DonsChecks:[],
      talkedPlayers:[],
      voting:{
        playersToVote:[],
        currentVotePlayer:-1,
        maxVotes:-1,
        maxVotedPlayers:[],
        isRevoting:false,
      },
    }
  
  console.log(`\n===================\nusersData:${JSON.stringify(usersData)}\n`);
  console.log(`players:${JSON.stringify(players)}\ngames:${JSON.stringify(games)}`);
}

function voteEvent(playerToVoteList){
  setTimeout(()=>{
    //emit.to all playerToVoteList.pop() // отправка игрока на голосование
    voteEvent(playerToVoteList)
  },5000);
}
//TO DO: function shareGameState emit.
function gameTick(){
  games.forEach(game=>{
    if(game.remainingTime--){
      switch (game.phase){
        case gamePhases.DAY:
          game.remainingTime=60;
          //человек договорил, записываем его к людям, которые поговорили и передаём ход следующему
          game.talkedPlayers.push(game.currentTurnPlayer++);
          if(!players.find(player=>{player.number===game.currentTurnPlayer})){game.currentTurnPlayer=1}
          //когда среди игроков не остаётся таких, которые не поговорили переходим к голосованию
          if(!players.every(player=>{talkedPlayers.includes(player.number)||player.role===roles.GAME_MASTER})){
          //все поговорили-> очищаем список и запускаем голосование
            game.talkedPlayers = [];
            game.phase = gamePhases.VOTING;
            
          }
            //TO DO: emit на обновление состояния
          break;
        case gamePhases.VOTING:
          game.remainingTime=5;
          //Процесс голсоования
          switch(game.voting.playersToVote.length){    
              //никто не выставлен -> уходим в ночь
            case 0:
              
              break;
              //выставлен только 1 -> кик и уходим в ночь
            case 1:

              break;
              //выставлено больше 1 -> голосование
            default:
              let listOfPlayersToVote = game.voting.playersToVote;
            if(game.voting.length !==0){
              votedPlayer = game.voting.playersToVote.pop();
              //TO DO: отправить игрока, за которого сейчас голосуют
            }
            //считаем голоса
            let listOfVotes=[];
            let revotedPlayers=[];
            players.forEach(player=>{
              voteInCount =  player.votedIn.length;
              listOfVotes.push({playerNumber:player.number,voteInCount:voteInCount});
            });
            
            //самый заголосованный игрок
            let maxVotedPlayer = listOfVotes.reduce((prev,cur)=>{prev.voteInCount<cur?.voteInCount?prev:cur},{playerNumber:-1,voteInCount:-1});
            revotedPlayers = listOfVotes.filter((voted)=>voted.voteInCount===maxVotedPlayer.voteInCount);
            if (revotedPlayers.map(revotedPlayer=>{revotedPlayers.playerNumber})===game.voting){
            }
            game.voting = [];
              revotedPlayers.forEach((revotedPlayer)=>{
                game.voting.push(revotedPlayer.playerNumber);
              })
            break;
            }
          break;
        case gamePhases.NIGHT:
          game.remainingTime=30;

        break;
      }



    }
  })
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
  console.log(`players:${JSON.stringify(players)}\ngames:${JSON.stringify(games)}`);
  clients.forEach(client=>{
    delete players[getMailByClient(client)];
  });
  delete games[roomID];
  console.log(`players:${JSON.stringify(players)}\ngames:${JSON.stringify(games)}`);
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
    let keyid;
    for (let key in usersData) {
      if (usersData[key].email === userData.email) {
        emailExists = true;
        keyid = key;
        break;
      }
    }
  
    if (emailExists) {
      delete usersData[keyid];
      io.to(keyid).emit(ACTIONS.KICK, 'Вы зашли с другого устройства.');
      //https://upgraide.me/chat?id=330a3c31-25b8-11ef-b1f4-0242c0a8800d
    }
    // Если email, отключаем старый токен
    console.log('New user added:', usersData);
    usersData[peerid] = userData;
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