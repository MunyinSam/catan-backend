import { Server, Socket } from 'socket.io'
import { generateRoomCode, rooms } from '../lobby/room'
import { createDefaultPlayer } from '../lobby/createDefaultPlayer'
import { Room, Player, Road, Settlement, City } from '../../interface/interface'
import { generateFullBoard, generatePorts } from '../game/game'
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
        const ports = generatePorts()
        rooms[roomCode] = {
            players: [player],
            createdAt: Date.now(),
            currentTurnIndex: 0,
            ports: ports,
            robberTileId: null
        }
        io.to(roomCode).emit('portsGenerated', ports)
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

    socket.on('getPorts', (roomCode) => {
        const room = rooms[roomCode]
        if (room) {
            socket.emit('portsGenerated', room.ports)
        } else {
            console.error(`Room not found for code: ${roomCode}`)
            socket.emit('error', { message: 'Room not found.' })
        }
    })
    socket.on('devCardUpdate', ({ roomCode, playerId, devCards }) => {
        const room = rooms[roomCode]
        if (!room) return

        const player = room.players.find((p) => p.id === playerId)
        if (player) {
            player.devCards = devCards // ✅ update server-side player data
            io.to(roomCode).emit('devCardUpdate', { playerId, devCards }) // broadcast to update clients
        }
    })

    socket.on('updatePoints', ({ roomCode, playerId, points }) => {
        const room = rooms[roomCode]

        if (!room) {
            console.error(`Room not found: ${roomCode}`)
            socket.emit('error', { message: 'Room not found.' })
            return
        }

        const player = room.players.find((p) => p.id === playerId)

        if (!player) {
            console.error(`Player not found: ${playerId} in room: ${roomCode}`)
            socket.emit('error', { message: 'Player not found.' })
            return
        }

        player.points = points
        io.to(roomCode).emit('pointsUpdated', {
            playerId,
            points,
        })
    })

    socket.on('updateLongestRoad', ({ roomCode, playerId, longestRoad }) => {
        // Update player in memory/database
        const room = rooms[roomCode]
        const player = room?.players.find((p) => p.id === playerId)
        if (player) {
            player.longestRoad = longestRoad
            io.to(roomCode).emit('longestRoadUpdated', {
                playerId,
                roadLength: longestRoad,
            })
        }
    })

    socket.on('updateRobberUsed', ({ roomCode, playerId, robberUsed }) => {
        const room = rooms[roomCode]

        if (!room) {
            console.error(`Room not found: ${roomCode}`)
            socket.emit('error', { message: 'Room not found.' })
            return
        }

        const player = room.players.find((p) => p.id === playerId)

        if (!player) {
            console.error(`Player not found: ${playerId} in room: ${roomCode}`)
            socket.emit('error', { message: 'Player not found.' })
            return
        }

        player.robberUsed = robberUsed // Corrected field assignment
        io.to(roomCode).emit('robberUsedUpdated', {
            playerId,
            robberUsed,
        })
    })

    socket.on('robberPlaced', ({ roomCode, tileId, playerId, log }) => {
        const room = rooms[roomCode]
        if (!room) return

        // Optional: Save robber position in the room state
        room.robberTileId = tileId

        // Broadcast to everyone in the room
        io.to(roomCode).emit('robberPlacedBroadcast', {
            tileId,
            playerId,
            log,
        })
    })
}
