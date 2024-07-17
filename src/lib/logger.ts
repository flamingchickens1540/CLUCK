import pino from 'pino'
import pretty from 'pino-pretty'

const logger = pino(
    pretty({
        levelKey: process.env.NODE_ENV === 'prod' ? 'info' : 'debug',
        colorize: true
    })
)

export default logger
