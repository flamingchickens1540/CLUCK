import { Logger as BoltLogger, LogLevel as BoltLogLevel } from '@slack/logger'
import pino, { LevelWithSilentOrString, LogFn } from 'pino'

const transport = pino.transport({
    targets: [
        {
            level: 'debug',
            target: 'pino-pretty',
            options: {
                colorize: true,
                levelFirst: false,
                ignore: 'pid,hostname'
            }
        }
    ]
})

const logger = pino({ level: 'debug' }, transport)

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setLevel(level) {
        return
    },
    getLevel() {
        return pinoToBoltLevel[logger.level]
    },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setName(name: string) {
        return
    },
    debug(...msgs) {
        logSlack(logger.trace.bind(logger), msgs)
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
