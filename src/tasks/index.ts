import logger from '~lib/logger'
import { updateSlackUsergroups } from '~tasks/slack_groups'
import { syncSlackMembers } from '~tasks/slack'
import { announceNewCerts } from '~tasks/certs'
import { updateSheet } from '~spreadsheet'

type TaskFunc = (reason: string) => Promise<void>
type Func = (() => void) | (() => Promise<void>)

const tasks: Record<string, TaskFunc> = {}

function scheduleTask(task: Func, interval_seconds: number, runOnInit: boolean, offset_seconds: number): TaskFunc {
    const label = 'task/' + task.name
    const cb = async (reason: string) => {
        try {
            await task()
        } catch (e) {
            logger.error({ name: label, error: e?.toString() }, 'Error running task for ' + reason)
            throw e
        }
        logger.info({ name: label }, 'Task ran successfully')
        return
    }
    if (runOnInit) {
        setTimeout(() => {
            cb('initial run')
        })
    }
    setTimeout(() => {
        setInterval(() => {
            cb('scheduled run')
        }, interval_seconds * 1000)
    }, offset_seconds * 1000)
    return cb
}

export function scheduleTasks() {
    // Offset is to combat Slack's rate limits
    const isProd = process.env.NODE_ENV === 'prod'

    tasks['Sync Sheet'] = scheduleTask(updateSheet, 60 * 30, isProd, 0) // Update spreadsheet every half-hour
    tasks['Sync Members'] = scheduleTask(syncSlackMembers, 60 * 60, isProd, 0) // Update slack members every hour, can also be run manually on admin dashboard
    tasks['Announce Certs'] = scheduleTask(announceNewCerts, 60 * 60, isProd, 60) // Just in case the cert announcement isn't automatically run on changes
    tasks['Sync Departments'] = scheduleTask(updateSlackUsergroups, 60 * 60, isProd, 120)
}

export async function runTask(key: string) {
    if (key in tasks) {
        await tasks[key]('manual run')
    } else {
        logger.warn('No task found for key: ' + key)
    }
}

export function getTaskKeys(): string[] {
    return Object.keys(tasks)
}
