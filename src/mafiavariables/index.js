const roles = {
    GAME_MASTER: 'game-master',
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
module.exports = {roles, gameStates, gamePhases};