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
    ENABLE_CAMERA: 'enable-camera',
    DISABLE_CAMERA: 'disable-camera',
    // TEST: 'test'
};

module.exports = ACTIONS;