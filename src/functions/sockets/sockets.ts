import { Server, Socket } from 'socket.io'
import { generateRoomCode, rooms } from '../lobby/room'
import { createDefaultPlayer } from '../lobby/createDefaultPlayer'
import { Room, Player, Road, Settlement, City } from '../../interface/interface'
import { generateFullBoard } from '../game/generateFullBoard'
import { playerColors } from '../../constant/colors'

function getNextColor(usedColors: string[]) {
    return (
        playerColors.find((color) => !usedColors.includes(color)) || '#000000'
    )
}

export function registerSocketHandlers(io: Server, socket: Socket) {
    socket.on('createGame', (playerName: string) => {
        const roomCode = generateRoomCode()
        const color = getNextColor([])
        const player: Player = createDefaultPlayer(socket.id, playerName, color)
        rooms[roomCode] = {
            players: [player],
            createdAt: Date.now(),
            currentTurnIndex: 0,
        }
        socket.join(roomCode)
        socket.emit('gameCreated', roomCode)
        io.to(roomCode).emit('playerList', rooms[roomCode].players)
    })

    socket.on('joinGame', (roomCode: string, playerName: string) => {
        const room = rooms[roomCode] // room is string array
        if (room && room.players.length < 6) {
            const usedColors = room.players.map((p) => p.color)
            const color = getNextColor(usedColors)
            const player: Player = createDefaultPlayer(
                socket.id,
                playerName,
                color
            )
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
            const index = room.players.findIndex((p) => p.id === socket.id)
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

    socket.on('playerReady', (roomCode: string) => {
        const room = rooms[roomCode]
        if (!room) return

        const player = room.players.find((p) => p.id === socket.id)
        if (player) {
            player.isReady = true
            io.to(roomCode).emit('playerList', room.players)

            // Check if all players are ready
            const allReady =
                room.players.length > 0 && room.players.every((p) => p.isReady)
            if (allReady) {
                io.to(roomCode).emit('allPlayerReady') // trigger frontend to start game
            }
        }
    })

    socket.on('gameStart', (roomCode) => {
        const board = generateFullBoard()
        const room = rooms[roomCode]
        if (!room) return
        room.board = board
        room.currentTurnIndex = 0 // start at player 0's turn
        io.to(roomCode).emit('gameStart', board)
        io.to(roomCode).emit('turnChanged', room.currentTurnIndex)
    })

    socket.on('diceRoll', ({ roomCode, rolls }) => {
        console.log(`Room ${roomCode} rolled ${rolls[0]} and ${rolls[1]}`)
        io.to(roomCode).emit('updateDiceRoll', rolls)
    })

    socket.on('getPlayer', ({ roomCode }) => {
        const room = rooms[roomCode]
        if (!room) return

        const player = room.players.find((p) => p.id === socket.id)
        if (player) {
            socket.emit('yourPlayer', player.name)
        }
    })

    socket.on('endTurn', (roomCode) => {
        const room = rooms[roomCode]
        if (!room) return

        // Advance turn index
        room.currentTurnIndex =
            (room.currentTurnIndex + 1) % room.players.length

        // Broadcast new turn to all players
        io.to(roomCode).emit('turnChanged', room.currentTurnIndex)
    })

    socket.on('buildRoad', ({ roomCode, road }) => {
        // Optionally: Validate road data here

        // Broadcast to other clients in the room
        socket.to(roomCode).emit('roadBuilt', { road })
    })

    socket.on('buildSettlement', ({ roomCode, settlement }) => {
        socket.to(roomCode).emit('settlementBuilt', { settlement })
    })

    socket.on('buildCity', ({ roomCode, city }) => {
        socket.to(roomCode).emit('roadCity', { city })
    })

    socket.on('resourceLog', (msg) => {
        socket.broadcast.emit('resourceLog', msg)
    })
}
