const { io } = require('socket.io-client');

const options = {
    "force new connection": true,
    reconnectionAttempts: "Infinity",
    timeout: 10000,
    transports: ["websocket"]
}
// const socket = io('http://localhost:3001',options);
const socket = io('http://192.168.1.80:3001',options);

module.exports = socket;
