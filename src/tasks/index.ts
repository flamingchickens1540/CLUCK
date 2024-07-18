import { updateSheet } from '~spreadsheet'
import { syncSlackMembers } from '~tasks/slack'
import { scheduleCertAnnouncement } from '~tasks/certs'
import logger from '~lib/logger'

const tasks: NodeJS.Timeout[] = []

type Func = (() => void) | (() => Promise<void>)
function scheduleTask(task: Func, interval_seconds: number, runOnInit: boolean) {
    const cb = async () => {
        try {
            await task()
        } catch (e) {
            logger.error({ name: task.name, error: e }, 'Error running scheduled task')
        } finally {
            logger.info({ name: task.name }, 'Scheduled task ran')
        }
    }
    if (runOnInit) {
        cb()
    }
    tasks.push(setInterval(cb, interval_seconds * 1000))
}

export function scheduleTasks() {
    const isProd = process.env.NODE_ENV === 'prod'
    scheduleTask(updateSheet, 60 * 30, isProd) // Update spreadsheet every half-hour
    scheduleTask(syncSlackMembers, 60 * 60, isProd) // Update slack members every hour, can also be run manually on admin dashboard
    setInterval(scheduleCertAnnouncement, 60 * 60, true) // Just in case the cert announcement isn't automatically run on changes
}

export function cancelTasks() {
    for (const task of tasks) {
        clearInterval(task)
    }
}
