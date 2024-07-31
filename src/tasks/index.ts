import logger from '~lib/logger'
import { scheduleUpdateSlackUsergroups } from '~tasks/slack_groups'
import { syncSlackMembers } from '~tasks/slack'
import { scheduleCertAnnouncement } from '~tasks/certs'
import { updateSheet } from '~spreadsheet'

const tasks: NodeJS.Timeout[] = []

type Func = (() => void) | (() => Promise<void>)
function scheduleTask(task: Func, interval_seconds: number, runOnInit: boolean, offset_seconds: number) {
    const cb = async () => {
        try {
            await task()
        } catch (e) {
            logger.error({ name: task.name, error: e }, 'Error running scheduled task')
            return
        }
        logger.info({ name: task.name }, 'Scheduled task ran successfully')
    }
    if (runOnInit) {
        setTimeout(cb)
    }
    setTimeout(() => tasks.push(setInterval(cb, interval_seconds * 1000)), offset_seconds * 1000)
}

export function scheduleTasks() {
    // Offset is to combat Slack's rate limits
    const isProd = process.env.NODE_ENV === 'prod'
    scheduleTask(updateSheet, 60 * 30, isProd, 0) // Update spreadsheet every half-hour
    scheduleTask(syncSlackMembers, 60 * 60, isProd, 0) // Update slack members every hour, can also be run manually on admin dashboard
    scheduleTask(scheduleCertAnnouncement, 60 * 60, isProd, 60) // Just in case the cert announcement isn't automatically run on changes
    scheduleTask(scheduleUpdateSlackUsergroups, 60 * 60, isProd, 120)
}

export function cancelTasks() {
    for (const task of tasks) {
        clearInterval(task)
    }
}
