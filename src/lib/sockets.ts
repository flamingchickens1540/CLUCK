import { Server as SocketIOServer } from 'socket.io'
import { WSCluckChange } from '@/types'

let io: SocketIOServer | null = null
export function startWS() {
    if (io != null) {
        return
    }
    io = new SocketIOServer(3001, {
        cors: {
            origin: 'http://localhost:3000'
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
