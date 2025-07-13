// server.ts
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'

const app = express()
app.use(cors())

const httpServer = createServer(app)
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
})

type Room = {
    players: string[]
}

const rooms: Record<string, Room> = {}

function generateRoomCode(length = 5) {
    return Math.random()
        .toString(36)
        .substring(2, 2 + length)
        .toUpperCase()
}

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id)

    socket.on('createGame', () => {
        const roomCode = generateRoomCode()
        rooms[roomCode] = { players: [socket.id] }
        socket.join(roomCode)
        socket.emit('gameCreated', roomCode)
        console.log(rooms)
        io.to(roomCode).emit('playerList', rooms[roomCode].players)
        console.log('Game created:', roomCode)
    })

    socket.on('joinGame', (roomCode: string) => {
        const room = rooms[roomCode]
        if (room && room.players.length < 6) {
            room.players.push(socket.id)
            socket.join(roomCode)

            socket.emit('joinedGame', roomCode)
            socket.emit('playerList', room.players)

            socket.to(roomCode).emit('playerList', room.players)
        } else {
            socket.emit('error', 'Room not found or full.')
        }
    })

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)

        for (const [roomCode, room] of Object.entries(rooms)) {
            const index = room.players.indexOf(socket.id)
            if (index !== -1) {
                room.players.splice(index, 1)
                io.to(roomCode).emit('playerList', room.players)
            }

            if (room.players.length === 0) {
                delete rooms[roomCode]
            }
        }
    })

    socket.on('getPlayerList', (roomCode: string) => {
        const room = rooms[roomCode]
        if (room) {
            socket.emit('playerList', room.players)
        }
    })
})

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000

httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Socket server running on http://0.0.0.0:${PORT}`)
})