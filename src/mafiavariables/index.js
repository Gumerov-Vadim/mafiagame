const roles = {
    GAME_MASTER: 'ВЕДУЩИЙ',
    SPECTATOR:'НАБЛЮДАТЕЛЬ',
    MAFIA: 'МАФИЯ',
    CITITZEN: 'МИРНЫЙ',
    SHERIFF: 'ШЕРИФ',
    DON:'ДОН МАФИИ',
  }
  const gameStates = {
    IDLE:'idle',
    IS_PAUSED: 'is-paused',
    GAME_ON: 'game-on',
  }
  const gamePhases = {
    DAY:'День',
    NIGHT: 'Ночь',
    VOTING: 'Голосование',
    FAMILIARZATION_NIGHT:'Ознакомительная ночь',
  }
module.exports = {roles, gameStates, gamePhases};