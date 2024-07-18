import { Logger as BoltLogger, LogLevel as BoltLogLevel } from '@slack/logger'
import pino, { LevelWithSilentOrString, LogFn, Logger as PinoLogger } from 'pino'
import pretty from 'pino-pretty'

const logger = pino(
    pretty({
        colorize: true,
        levelFirst: false,
        ignore: 'pid,hostname'
    })
)
logger.level = process.env.NODE_ENV === 'prod' ? 'info' : 'debug'

const pinoToBoltLevel: Record<LevelWithSilentOrString, BoltLogLevel> = {
    fatal: BoltLogLevel.ERROR,
    error: BoltLogLevel.ERROR,
    warn: BoltLogLevel.WARN,
    info: BoltLogLevel.INFO,
    debug: BoltLogLevel.DEBUG,
    trace: BoltLogLevel.DEBUG,

    silent: BoltLogLevel.ERROR
}

export const createBoltLogger = (params: { logger: PinoLogger }): BoltLogger => ({
    setLevel(level) {
        logger.level = level
    },
    getLevel() {
        return pinoToBoltLevel[logger.level]
    },
    setName(name: string) {
        return
    },
    debug(...msgs) {
        logSlack(logger.debug.bind(logger), msgs)
    },
    info(...msgs) {
        logSlack(logger.info.bind(logger), msgs)
    },
    warn(...msgs) {
        logSlack(logger.warn.bind(logger), msgs)
    },
    error(...msgs) {
        logSlack(logger.error.bind(logger), msgs)
    }
})

function logSlack(logFn: LogFn, msgs: unknown[]) {
    if (msgs.length === 0) {
        return
    } else if (msgs.length === 1) {
        logFn({}, msgs[0] as string | undefined)
    } else {
        logFn({ msg: msgs.slice(1) }, msgs[0] as string | undefined)
    }
}
export default logger
