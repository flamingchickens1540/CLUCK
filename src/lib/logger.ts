import { Logger as BoltLogger, LogLevel as BoltLogLevel } from '@slack/logger'
import pino, { LevelWithSilentOrString, LogFn } from 'pino'
import pretty from 'pino-pretty'

const logger = pino(
    { level: 'info' },
    pretty({
        colorize: true,
        levelFirst: false,
        ignore: 'pid,hostname'
    })
)

const pinoToBoltLevel: Record<LevelWithSilentOrString, BoltLogLevel> = {
    fatal: BoltLogLevel.ERROR,
    error: BoltLogLevel.ERROR,
    warn: BoltLogLevel.WARN,
    info: BoltLogLevel.INFO,
    debug: BoltLogLevel.DEBUG,
    trace: BoltLogLevel.DEBUG,

    silent: BoltLogLevel.ERROR
}

export const createBoltLogger = (): BoltLogger => ({
    setLevel(level) {
        return
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
    } else if (msgs.length == 1) {
        logFn({ name: 'slack' }, msgs[0] as string)
    } else {
        try {
            logFn({ name: 'slack', ...(msgs[0] as object) }, msgs.slice(1).join(', '))
        } catch {
            logFn({ name: 'slack' }, msgs.join(', '))
        }
    }
}
export default logger
