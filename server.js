const path = require('path');
const fs = require('fs');
const https = require('https');
const express = require('express');
const app = express();
// const server = require('http').createServer(app);
const key = fs.readFileSync('cert.key');
const cert = fs.readFileSync('cert.crt');
const server = https.createServer({key, cert}, app);
const io = require('socket.io')(server,{
  cors:{
    origin:[
      'https://192.168.1.80'
    ],
    methods:["GET","POST"]
  }
});
const {version, validate} = require('uuid');
const {roles,gamePhases,gameStates} = require('./src/mafiavariables');

const ACTIONS = require('./src/socket/actions');
const { copyFileSync } = require('fs');
const { METHODS } = require('https');
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
let games = {};

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
  console.log(`ROLES:${JSON.stringify(listOfRoles)}`);
  return listOfRoles;
}
function resetVoting(game){
  game.voting = {
    playersToVote:[],
    isRevoting:0,
  };
  resetPlayersVotes(game);
}
function resetPlayersVotes(game){
  game.players.forEach(player=>{
    player.voteIn=[];
    player.myVote=-1;
  })
}
function isAlivePlayer(player){
  return (player.role!==roles.GAME_MASTER)&&(player.isAlive);
}
function sendEmitToAll(game,action,sendedObject){
  game.players.forEach(player=>{
    io.to(player.clientID).emit(action,sendedObject);
  });
}
function sendEmitToPlayerWithRole(game,role,action,sendedObject){
  game.players.forEach(player=>{
    if(player.role===role){io.to(player.clientID).emit(action,sendedObject);}
  });
}
function sendEmitToPlayerUnlessRole(game,role,action,sendedObject){
  game.players.forEach(player=>{
    if(player.role!==role){io.to(player.clientID).emit(action,sendedObject);}
  });
}
function playerReconnected(mail, clientID){
  const game = Object.values(games).find(game=>{
    return game.players.some(player=>{return player.mail===mail})
  });
  if(game){
  const player = game.players.find(player=>{return player.mail===mail}).clientID = clientID;
  sharePlayers(game);
  }
}
function sharePlayers(game){
  
  game.players.forEach(playerToEmit=>{
    let players = {};
    if(playerToEmit.role===roles.GAME_MASTER){
      game.players.forEach(player=>{
        players[player.clientID]=
        {
          clientID:player.clientID,
          name:usersData[player.clientID].name,
          gender:usersData[player.clientID].gender,
          number:player.number,
          role:player.role,
          isAlive:player.isAlive,
        }
      })
    }
    else if(playerToEmit.role===roles.MAFIA){
      game.players.forEach(player=>{
      players[player.clientID]=
      {
        clientID:player.clientID,
        name:usersData[player.clientID].name,
        gender:usersData[player.clientID].gender,
        number:player.number,
        role:playerToEmit.clientID===player.clientID?player.role:(player.role===(roles.MAFIA||roles.DON||roles.GAME_MASTER))?player.role:'',
        isAlive:player.isAlive,
      }
      })
    }
    else if(playerToEmit.role===roles.DON){
      game.players.forEach(player=>{
      players[player.clientID]=
      {
        clientID:player.clientID,
        name:usersData[player.clientID].name,
        gender:usersData[player.clientID].gender,
        number:player.number,
        role:playerToEmit.clientID===player.clientID?player.role:((player.role===(roles.MAFIA||roles.DON||roles.GAME_MASTER))||game.DonsChecks.includes(player.number))?player.role:'',
        isAlive:player.isAlive,
      }
      })
    }
    else if(playerToEmit.role===roles.SHERIFF){
      game.players.forEach(player=>{
      players[player.clientID]=
      {
        clientID:player.clientID,
        name:usersData[player.clientID].name,
        gender:usersData[player.clientID].gender,
        number:player.number,
        role:playerToEmit.clientID===player.clientID?player.role:(game.SheriffsChecks.includes(player.number)||player.role===roles.GAME_MASTER)?player.role:'',
        isAlive:player.isAlive,
      }
      })
    }
    else{
      game.players.forEach(player=>{
      players[player.clientID]=
      {
        clientID:player.clientID,
        name:usersData[player.clientID].name,
        gender:usersData[player.clientID].gender,
        number:player.number,
        role:playerToEmit.clientID===player.clientID?player.role:player.role===roles.GAME_MASTER?player.role:'',
        isAlive:player.isAlive,
      }
      })
    }
    //добавить обновление ролей для проверок дона и шерифа
    io.to(playerToEmit.clientID).emit(ACTIONS.GAME_EVENT.SHARE_PLAYERS,{players:players})
  })
}
function initGame(roomID,clients){
  const countOfPlayers =8;//clients.lenght;
  if (countOfPlayers<7||countOfPlayers>12) {return []}
  if(games[roomID]){return};
  const moderator = clients.find(client=>{return roomModerators[roomID] === client});
  let listOfRandomNums = getListOfRandomNums(clients.length-1);
  let listOfRoles = getListOfRoles(clients.length-1);
  let listOfPlayers = [];
  clients.forEach(client=>{
    const mail = getMailByClient(client);
    listOfPlayers.push({
      mail:mail,
      clientID:client,
      role:(client===moderator)?roles.GAME_MASTER:listOfRoles.pop(),
      number:(client===moderator)?0:listOfRandomNums.pop(),
      isCamPermit: true,
      isMicPermit: true,
      isAlive:true,
      votedIn:[],
      myVote:-1,
      myPutUp:0,
    });
  })
  
  games[roomID] = {
      moderator:moderator,
      remainingTime:60,
      state: gameStates.GAME_ON,
      phase:gamePhases.DAY,
      circleCount:0,
      currentTurnPlayerNumber:1,
      deadList:[],
      talkedPlayers:[],
      SheriffsChecks:[],
      DonsChecks:[],
      shots:[],
      players:listOfPlayers,
      voting:{
        playersToVote:[],
        isRevoting:0,
      }
    }
    sharePlayers(games[roomID]);
  // console.log(`\n===================\nusersData:${JSON.stringify(usersData)}\n`);
  // console.log(`games:${JSON.stringify(games)}`);

  
  sendEmitToAll(games[roomID],ACTIONS.GAME_EVENT.SHARE_PHASE,{phase:games[roomID].phase});
  sendEmitToAll(games[roomID],ACTIONS.GAME_EVENT.SHARE_CURRENT_TURN_PLAYER,{curTurnPlayerNumber:games[roomID].currentTurnPlayerNumber});
  
}

function gameTick(){
  Object.values(games).forEach(game=>{
    if((game.state===gameStates.IDLE)||(game.state===gameStates.IS_PAUSED)){return}
    sendEmitToAll(game,ACTIONS.GAME_EVENT.SHARE_REMAINING_TIME,{remTime:game.remainingTime});
    if(!game.remainingTime--){
      sendEmitToAll(game,ACTIONS.GAME_EVENT.SHARE_PHASE,{phase:game.phase});
      sendEmitToAll(game,ACTIONS.GAME_EVENT.SHARE_STATE,{state:game.state});
      // sendEmitToAll(game,ACTIONS.GAME_EVENT.SHARE_PUT_UP_FOR_VOTE,{putUpForVoteList:game.voting.playersToVote});

      switch (game.phase){
        case gamePhases.DAY:
          game.remainingTime=60;//60
          //человек договорил, записываем его к людям, которые поговорили и передаём ход следующему
          game.talkedPlayers.push(game.currentTurnPlayerNumber);
          do{
            game.currentTurnPlayerNumber=++game.currentTurnPlayerNumber;
          //если выходим за список игроков ставим указатель на первого игрока
          if(!(game.players.some(player=>{return player.number===game.currentTurnPlayerNumber}))){game.currentTurnPlayerNumber=1}
          } while(game.players.find(player=>{return (player.number===game.currentTurnPlayerNumber)&&(!player.isAlive)}))
            //пропускаем мёртвых игроков
          
          sendEmitToAll(game,ACTIONS.GAME_EVENT.SHARE_CURRENT_TURN_PLAYER,{curTurnPlayerNumber:game.currentTurnPlayerNumber});
           //когда среди живых игроков не остаётся таких, которые не поговорили переходим к голосованию
          if(game.players.every(player=>{return game.talkedPlayers.includes(player.number)||player.role===roles.GAME_MASTER||!player.isAlive})){
          //все поговорили-> очищаем список и запускаем голосование
            game.talkedPlayers = [];
            game.phase = gamePhases.VOTING;
            
            let message ='Все поговорили.\nВыставлены игроки под номерами:\n';
            game.voting.playersToVote.forEach((ptv)=>{message = message+' '+ptv});
            message = message + '\nГолосование!';
            sendEmitToAll(game,ACTIONS.GAME_EVENT.MESSAGE,{mes:message});
            game.remainingTime=3;
          }
            //TO DO: emit на обновление состояния, разрешение поговорить
            
          break;
        case gamePhases.VOTING:
          // если 
          game.remainingTime=5;
          game.talkedPlayers = [];
          switch(game.voting.isRevoting){
            
            default:
              
              if(game.voting.playersToVote.length<2){
                //Если остался 1 человек, все непроголосовавшие живые игроки голосуют в него.
                if(game.voting.playersToVote.length===1){
                  let lastVotedPlayerNumber = game.voting.playersToVote.pop();
                  game.players.forEach((player)=>{
                    if(isAlivePlayer(player)){player.myVote = player.myVote===-1?lastVotedPlayerNumber:player.myVote;}
                  });
                  let lastVotedPlayer = game.players.find((player)=>{return player.number===lastVotedPlayerNumber});
                  game.players.forEach((player)=>{
                    if(isAlivePlayer(player)){
                    if(player.myVote===lastVotedPlayerNumber){
                      lastVotedPlayer.votedIn.push(player.number);
                    }}
                  });
                }
                //считаем голоса
                let maxVotes = -1;
                game.players.forEach((player)=>{
                  if(isAlivePlayer(player)){
                  maxVotes = player.votedIn.length>maxVotes?player.votedIn.length:maxVotes;
                  }
                });
                let countMaxVotedPlayers = 0;
                game.players.forEach((player)=>{
                  if(isAlivePlayer){
                  countMaxVotedPlayers = player.votedIn.length===maxVotes?++countMaxVotedPlayers:countMaxVotedPlayers;
                  }
                });

                //результат голосования
                if(countMaxVotedPlayers===0||maxVotes===0){
                  sendEmitToAll(game,ACTIONS.GAME_EVENT.MESSAGE,{mes:'Никто не был изгнан.\nГород засыпает...'});
                  resetVoting(game);
                  game.phase = gamePhases.NIGHT;
                  game.remainingTime = 3;
                }
                else if(countMaxVotedPlayers===1){
                  const playerToReject = game.players.find(player=>{return player.votedIn.length===maxVotes});
                  const message = 'был изгнан игрок №'+playerToReject.number+' \nГород засыпает...'; 
                  playerToReject.isAlive = false;
                  sendEmitToAll(game,ACTIONS.GAME_EVENT.MESSAGE,{mes:message});
                  sharePlayers(game);
                  resetVoting(game);
                  game.phase = gamePhases.NIGHT;
                  game.remainingTime = 3;
                }
                else{
                sendEmitToAll(game,ACTIONS.GAME_EVENT.MESSAGE,{mes:'Игроки набрали равное количество голосов, переголосование...'});
                game.remainingTime = 3;
                 game.players.forEach((player)=>{
                    player.myVote = -1;
                    if(player.voteIn.length === maxVotes){game.voting.playersToVote.push(player.number);};
                    player.voteIn = [];
                  })
                  game.voting.isRevoting++;
                }
              }else{
                sendEmitToPlayerUnlessRole(game,roles.GAME_MASTER,ACTIONS.GAME_EVENT.VOTE_FOR_THE_PLAYER,{playerToVote:game.voting.playersToVote.pop()});
              }
              break;
            //переголосований слишком много, спросим исключить двоих?
            case 2:
              sendEmitToAll(game,ACTIONS.GAME_EVENT.MESSAGE,{mes:'Игроки набрали равное количество голосов. Исключить всех?'});
              game.remainingTime = 3;
                game.voting.isRevoting++;
              break;
              //результат
            case 3:
              let countOfVotesOfExludingBoth=0;
              game.players.forEach(player=>{
                player.myVote ===-2?countOfVotesOfExludingBoth++:countOfVotesOfExludingBoth;
              });
              if(countOfVotesOfExludingBoth>(game.players.filter(player=>player.isAlive).length-countOfVotesOfExludingBoth)){
                //emit кик двоих, уходим в ночь
                //Игроки (номера) были исключены. Город засыпает...
              }
              else{
                // скип, уходим в ночь. 
                  sendEmitToAll(game,ACTIONS.GAME_EVENT.MESSAGE,{mes:'Никто не был исключён. Город засыпает...'});
                //emit уходим в ночь.

              }
              break;
          }
          break;
        case gamePhases.NIGHT:
          game.remainingTime=2;
          console.log(`[...new Set(game.shots)]:${JSON.stringify([...new Set(game.shots)])}\n
          game.players:${JSON.stringify(game.players)}\n
          game.shots:${JSON.stringify(game.shots)}`)
          setTimeout(()=>{
            if(([...new Set(game.shots)].length)===1){
              sendEmitToAll(game,ACTIONS.GAME_EVENT.MESSAGE,{mes:'Звук выстрела.'});
              console.log(`players:${JSON.stringify(game.players)},\ngame.shots${JSON.stringify(game.shots)}`);
              const player = game.players.find(player=>{return player.number===game.shots.pop()})
           if(player){
            console.log(`player:${JSON.stringify(player)}`);
              // player?.isAlive = false;
            }
            }else{
              sendEmitToAll(game,ACTIONS.GAME_EVENT.MESSAGE,{mes:'несострел...'});
            }

            game.remainingTime=3;
            game.phase=gamePhases.DAY;
            sendEmitToAll(game,ACTIONS.GAME_EVENT.SHARE_PHASE,{phase:game.phase});
            game.circleCount = ++game.circleCount;
            game.curTurnPlayerNumber = game.circleCount + 1;
          },1000);
          //30
          //emit мафия выбирает в кого выстрелить...
          //Шериф и дон выбирают кого проверить...
          //Город просыпается
        break;
      }
    }
  })
}
setInterval(gameTick,1000);
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
          restartGame(roomID,clients);
          break;
        case ACTIONS.MA.PAUSE_GAME:
          pauseGame(roomID);
          break;
        case ACTIONS.MA.RESUME_GAME:
          resumeGame(roomID);
          break;
          case ACTIONS.MA.FAST_BACKWARD:
          fastBackward(roomID);
          break;
          case ACTIONS.MA.FAST_FORWARD:
          fastForward(roomID);
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
  games[roomID].state= gameStates.GAME_ON;
  sendEmitToAll(games[roomID],ACTIONS.GAME_EVENT.SHARE_STATE,{state:gameStates.GAME_ON});
  //emit уведомление о ролях
  //timeout emit на включение вебок для мафии
  //timeout emit на выключение.
}

function restartGame(roomID,clients){
  finishGame(roomID);
  startGame(roomID,clients);
  games[roomID].state= gameStates.GAME_ON;
  sendEmitToAll(games[roomID],ACTIONS.GAME_EVENT.SHARE_STATE,{state:gameStates.GAME_ON});
}

function pauseGame(roomID){
  games[roomID].state= gameStates.IS_PAUSED;
  sendEmitToAll(games[roomID],ACTIONS.GAME_EVENT.SHARE_STATE,{state:gameStates.IS_PAUSED});
  //clearInterval gameloop
}

function resumeGame(roomID){
  games[roomID].state= gameStates.GAME_ON;
  sendEmitToAll(games[roomID],ACTIONS.GAME_EVENT.SHARE_STATE,{state:gameStates.GAME_ON});
  //Interval gameloop
}
function fastBackward(roomID){
  const game = games[roomID];
  if(game?.phase===gamePhases.DAY){
    game.talkedPlayers.pop();
    game.currentTurnPlayerNumber=--game.currentTurnPlayerNumber;
    game.remainingTime=60;
    sendEmitToAll(game,ACTIONS.GAME_EVENT.SHARE_CURRENT_TURN_PLAYER,{curTurnPlayerNumber:game.currentTurnPlayerNumber})
  }
}
function fastForward(roomID){
  games[roomID].remainingTime = 1;
}
function finishGame(roomID){
  games[roomID].state= gameStates.IDLE;
  sendEmitToAll(games[roomID],ACTIONS.GAME_EVENT.SHARE_STATE,{state:gameStates.IDLE});
  delete games[roomID];
  //emit уведомление о завершении
  //delete users role, number, data и прочее...
}

  //Обработчик действия выставления игрока на голосование
  const putToVoteHandler = ({playerNumber:playerNumber,roomID:roomID}) =>{
    games[roomID]?.voting?.playersToVote.push(playerNumber);
    sendEmitToAll(games[roomID],ACTIONS.GAME_EVENT.SHARE_PUT_UP_FOR_VOTE,{playersToVote:games[roomID]?.voting?.playersToVote})
  }
  //Игрок выставил на голосование
  socket.on(ACTIONS.PLAYERS_ACTION.PUT_TO_VOTE,putToVoteHandler)
  //Проголосовать на голосовании
  const voteHandler = ({roomID:roomID, playerNumber:playerNumber, clientID:clientID})=>{
    (games[roomID]?.players.find(player=>{return player.clientID===clientID})).myVote=playerNumber;
    io.to(clientID).emit(ACTIONS.GAME_EVENT.SHARE_MY_VOTE,playerNumber);
  }
  socket.on(ACTIONS.PLAYERS_ACTION.VOTE,voteHandler);
  //Проверить игрока
  const checkRoleHandler = ({roomID:roomID, playerNumber:playerNumber, clientID:clientID})=>{
    const game = games[roomID];
    const player = (game?.players.find(player=>{return player.clientID===clientID}));
    if(player.role === roles.SHERIFF){
      game.SheriffsChecks.push(playerNumber);
    } else if(player.role === roles.DON){
      game.DonsChecks.push(playerNumber);  
    }
    sharePlayers(game);
  }
  socket.on(ACTIONS.PLAYERS_ACTION.CHECK_ROLE,checkRoleHandler);
  //Сделать выстрел
  const mafiaShotHandler = ({roomID:roomID, playerNumber:playerNumber, clientID:clientID})=>{
    const game = games[roomID];
    const player = (game?.players.find(player=>{return player.clientID===clientID}));
    if(player.role === roles.MAFIA||roles.DON){
      games[roomID].shots.push(playerNumber);
    }
    // if(game.shots.length>=(game.players.filter(player=>{return player.role===roles.MAFIA||roles.DON})).length){

    // }
  }
  socket.on(ACTIONS.PLAYERS_ACTION.MAFIA_SHOT,mafiaShotHandler);
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
    
    if (emailExists) {playerReconnected(userData.email,peerid);}
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
// app.use(express.static(__dirname));

app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

server.listen(PORT, () => {
  console.log('Server Started!')
})