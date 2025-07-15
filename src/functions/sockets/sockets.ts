import { Server, Socket } from 'socket.io'
import { generateRoomCode, rooms, Room, Player } from '../roomManager/room'
import { createDefaultPlayer } from '../createDefaultPlayer'

export function registerSocketHandlers(io: Server, socket: Socket) {
    socket.on('createGame', (playerName: string) => {
        const roomCode = generateRoomCode()
        const player: Player = createDefaultPlayer(socket.id, playerName)
        rooms[roomCode] = { players: [player], createdAt: Date.now() }
        socket.join(roomCode)
        socket.emit('gameCreated', roomCode)
        io.to(roomCode).emit('playerList', rooms[roomCode].players)
    })

    socket.on('joinGame', (roomCode: string, playerName: string) => {
        const room = rooms[roomCode] // room is string array
        if (room && room.players.length < 6) {
        const player: Player = createDefaultPlayer(socket.id, playerName)
            room.players.push(player)
            socket.join(roomCode)
            socket.emit('joinedGame', roomCode)
            socket.emit('playerList', room.players)
            socket.to(roomCode).emit('playerList', room.players)
        } else {
            socket.emit('error', 'Room not found or full.')
        }
    })

    socket.on('disconnect', () => {
        for (const [roomCode, room] of Object.entries(rooms)) {
            const index = room.players.findIndex(p => p.id === socket.id)
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

    socket.on('getRoomInfo', (roomCode: string) => {
        const room = rooms[roomCode]
        if (room) {
            socket.emit('roomInfo', room)
        }
    })
}
