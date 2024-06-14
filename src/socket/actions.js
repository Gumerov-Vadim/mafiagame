const ACTIONS = {
    JOIN: 'join',
    LEAVE: 'leave',
    SHARE_ROOMS: 'share-rooms',
    ADD_PEER: 'add-peer', //Создание нового соеднинения
    REMOVE_PEER: 'remove-peer', //Удаление соеднинения
    RELAY_SDP: 'relay-sdp', //Передача SDP данных, т.е. стримы с медиаданными
    RELAY_ICE: 'relay-ice', //Передача ICE кандидатов
    ICE_CANDIDATE: 'ice-candidate',
    SESSION_DESCRIPTION: 'session-description',    
    SET_MODERATOR: 'set-moderator', // New action
    //действия для модератора
    MODERATOR_ACTION: 'moderator-action',
    MA: 
    {
        CHANGE_PLAYER_MIC_ALLOW:'ma-change-player-mic-allow',
        CHANGE_PLAYER_CAM_ALLOW:'ma-change-player-cam-allow',
        SKIP_TURN:'ma-skip-turn',
        ASSIGN_PLAYER_TURN: 'ma-assign-player-turn',
        START_GAME:'start-game',
        PAUSE_GAME:'ma-pause-game',
        RESUME_GAME:'ma-resume-game',
        RESTART_GAME:'ma-restart-game',
        FINISH_GAME:'ma-finish-game',
    }, 
    // действия игроков 
    PLAYERS_ACTION:{
    VOTE:'vote',
    SHERIFF_CHECK:'sheriff-check',
    DON_CHECK:'don-check',
    MAFIA_SHOT:'mafia-shot'},
    KICK:'kick',
    CLIENT_INFO: 'client-info',
    GAME_EVENT:{
        SEND_ROLE:'send-role',
    }
    // TEST: 'test'
};

module.exports = ACTIONS;