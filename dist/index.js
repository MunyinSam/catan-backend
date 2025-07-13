"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server.ts
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});
const rooms = {};
function generateRoomCode(length = 5) {
    return Math.random()
        .toString(36)
        .substring(2, 2 + length)
        .toUpperCase();
}
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    socket.on('createGame', () => {
        const roomCode = generateRoomCode();
        rooms[roomCode] = { players: [socket.id] };
        socket.join(roomCode);
        socket.emit('gameCreated', roomCode);
        console.log(rooms);
        io.to(roomCode).emit('playerList', rooms[roomCode].players);
        console.log('Game created:', roomCode);
    });
    socket.on('joinGame', (roomCode) => {
        const room = rooms[roomCode];
        if (room && room.players.length < 6) {
            room.players.push(socket.id);
            socket.join(roomCode);
            socket.emit('joinedGame', roomCode);
            socket.emit('playerList', room.players);
            socket.to(roomCode).emit('playerList', room.players);
        }
        else {
            socket.emit('error', 'Room not found or full.');
        }
    });
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        for (const [roomCode, room] of Object.entries(rooms)) {
            const index = room.players.indexOf(socket.id);
            if (index !== -1) {
                room.players.splice(index, 1);
                io.to(roomCode).emit('playerList', room.players);
            }
            if (room.players.length === 0) {
                delete rooms[roomCode];
            }
        }
    });
    socket.on('getPlayerList', (roomCode) => {
        const room = rooms[roomCode];
        if (room) {
            socket.emit('playerList', room.players);
        }
    });
});
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Socket server running on http://0.0.0.0:${PORT}`);
});
