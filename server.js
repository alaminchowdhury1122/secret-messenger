const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Hardcoded users
const users = { "Bro": "pass123", "GF": "love456" };
let connectedUsers = [];

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

io.on('connection', (socket) => {
    socket.on('login', ({ username, password }) => {
        if (users[username] && users[username] === password && connectedUsers.length < 2) {
            if (!connectedUsers.includes(username)) {
                connectedUsers.push(username);
                socket.username = username;
                socket.emit('login_success', username);
            } else {
                socket.emit('login_fail', 'Already logged in!');
            }
        } else {
            socket.emit('login_fail', 'Wrong credentials or too many users!');
        }
    });

    socket.on('chat message', (data) => {
        if (socket.username) {
            io.emit('chat message', { user: socket.username, msg: data.msg });
        }
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            connectedUsers = connectedUsers.filter(u => u !== socket.username);
        }
    });
});

server.listen(3000, () => console.log('Server running on http://localhost:3000'));