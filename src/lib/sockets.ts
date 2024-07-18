import { Server as SocketIOServer } from 'socket.io'
import { Server as HttpServer } from 'http'

import { WSCluckChange } from '~types'
import logger from '~lib/logger'

let io: SocketIOServer | null = null
export function startWS(server: HttpServer) {
    if (io != null) {
        return
    }
    io = new SocketIOServer(server, {
        path: '/ws'
    })
    logger.info('Websocket server started')

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
