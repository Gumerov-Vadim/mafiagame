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
    KICK:'kick',
    MA: 
    {
        CHANGE_PLAYER_MIC_ALLOW:'ma-change-player-mic-allow',
        CHANGE_PLAYER_CAM_ALLOW:'ma-change-player-cam-allow',
        SKIP_TURN:'ma-skip-turn',
        ASSIGN_PLAYER_TURN: 'ma-assign-player-turn',
        START_GAME:'start-game',
        PAUSE_GAME:'ma-pause-game',
        RESUME_GAME:'ma-resume-game',
        FAST_BACKWARD:'fast-backward',
        FAST_FORWARD:'fast-forward',
        RESTART_GAME:'ma-restart-game',
        FINISH_GAME:'ma-finish-game',
    }, 
    // действия игроков 
    PLAYERS_ACTION:{
    PUT_TO_VOTE:'put_to_vote',
    VOTE:'vote',
    SHERIFF_CHECK:'sheriff-check',
    DON_CHECK:'don-check',
    MAFIA_SHOT:'mafia-shot'
    },
    CLIENT_INFO: 'client-info',
    GAME_EVENT:{
        SHARE_REMAINING_TIME:'share-remaining-time',
        SHARE_PLAYERS:'share-players',
        SHARE_PHASE:'share-phase',
        SHARE_STATE:'share-state',
        SHARE_CIRCLE_COUNT:'share-circle-count',
        SHARE_ROLE:'share-role',
        SHARE_ROLES:'share-roles',
        SHARE_PUT_UP_FOR_VOTE:'share-put-up-for-vote',
        SHARE_PERSONAL_INFO:'share-personal-info',
        SHARE_CURRENT_TURN_PLAYER:'share-current-turn-player',
        PASS_TO_THE_NEXT_PLAYER:'pass-to-the-next-player',
        VOTE_FOR_THE_PLAYER: 'vote-for-the-player',
        MESSAGE: 'message',
    },
    // TEST: 'test'
};

module.exports = ACTIONS;