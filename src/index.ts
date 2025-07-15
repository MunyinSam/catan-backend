// server.ts
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import { registerSocketHandlers } from './functions/sockets/sockets'

const app = express()
app.use(cors())

const httpServer = createServer(app)
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
})

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id)
    registerSocketHandlers(io, socket)
})

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000

httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Socket server running on http://0.0.0.0:${PORT}`)
})