const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Setup lowdb
const file = 'db.json';
const adapter = new JSONFile(file);
const db = new Low(adapter);

// Initialize database with default structure
async function initDb() {
    await db.read();
    // Explicitly set default data if it doesn't exist
    if (!db.data) {
        db.data = { messages: [] };
    } else if (!db.data.messages) {
        db.data.messages = [];
    }
    await db.write();
}
initDb();

// Hardcoded users
const users = { "Al Amin Chowdhury": "pass123", "Mrs. Chowdhury": "love456" };
let connectedUsers = [];

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

io.on('connection', (socket) => {
    socket.on('login', async ({ username, password }) => {
        if (users[username] && users[username] === password && connectedUsers.length < 2) {
            if (!connectedUsers.includes(username)) {
                connectedUsers.push(username);
                socket.username = username;
                socket.emit('login_success', username);

                // Send chat history to the user
                await db.read();
                const messages = db.data.messages || [];
                socket.emit('chat_history', messages);
            } else {
                socket.emit('login_fail', 'Already logged in!');
            }
        } else {
            socket.emit('login_fail', 'Wrong credentials or too many users!');
        }
    });

    socket.on('chat message', async (data) => {
        if (socket.username) {
            // Store message in database
            await db.read();
            db.data.messages.push({ user: socket.username, msg: data.msg });
            await db.write();

            // Broadcast message to all users
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