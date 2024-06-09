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
    MODERATOR_ACTION: 
    {
        MUTE_PLAYER:'ma-mute-player',
        UNMUTE_PLAYER:'ma-unmute-player',
        DISABLE_PLAYER_CAMERA:'ma-disable-player-camera',
        ENABLE_PLAYER_CAMERA:'ma-enable-player-camera',
        SKIP_TURN:'ma-skip-turn',
        ASSIGN_PLAYER_TURN: 'ma-assign-player-turn',
        PAUSE_GAME:'ma-pause-game',
        RESTART_GAME:'ma-restart-game',
        FINISH_GAME:'ma-finish-game',
    }, 
    // действия игроков 
    PLAYERS_ACTION:{
    TOGGLE_MY_MIC: 'toggle-my-mic',
    TOGGLE_MY_CAM: 'toggle-my-cam',
    VOTE:'vote',
    SHERIFF_CHECK:'sheriff-check',
    DON_CHECK:'don-check',
    MAFIA_SHOT:'mafia-shot'},
    KICK:'kick',

    CLIENT_INFO: 'client-info'
    // TEST: 'test'
};

module.exports = ACTIONS;