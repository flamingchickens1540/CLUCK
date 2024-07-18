import { Server as SocketIOServer } from 'socket.io'
import { Server as HttpServer } from 'http'

import { WSCluckChange } from '~types'

let io: SocketIOServer | null = null
export function startWS(server: HttpServer) {
    if (io != null) {
        return
    }
    io = new SocketIOServer(server, {
        path: '/ws',
        cors: {
            origin: ['http://localhost:3000', 'https://cluck.team1540.org']
        }
    })

    io.on('connection', (socket) => {
        socket.emit('hello', 'world')
        socket.on('hello', (data) => {
            socket.broadcast.emit('hello', data)
        })
    })
}

export function emitCluckChange(data: WSCluckChange) {
    io!.emit('cluck_change', data)
}
