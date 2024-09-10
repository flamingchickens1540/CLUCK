import logger from '~lib/logger'
import { updateSlackUsergroups } from '~tasks/slack_groups'
import { syncSlackMembers } from '~tasks/slack'
import { announceNewCerts, updateProfileCerts } from '~tasks/certs'
import { updateSheet } from '~spreadsheet'
import { syncFallbackPhotos } from './photos'
import schedule from 'node-schedule'
import { logoutAll, promptCheckinMessage } from './calendar'

type TaskFunc = ((reason: string) => Promise<void>) & { label: string }
type Func = (() => void) | (() => Promise<void>)

const tasks: Record<string, TaskFunc> = {}

function createTaskFunc(task: Func): TaskFunc {
    const label = 'task/' + task.name
    const func = async (reason: string) => {
        try {
            await task()
        } catch (e) {
            logger.error({ name: label, error: e?.toString() }, 'Error running task for ' + reason)
            throw e
        }
        logger.info({ name: label }, 'Task ran successfully')
        return
    }
    func.label = label
    return func
}
function scheduleTask(task: Func, interval_seconds: number, runOnInit: boolean, offset_seconds: number): TaskFunc {
    const cb = createTaskFunc(task)
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

function scheduleCronTask(task: TaskFunc, cron_exp: string) {
    schedule.scheduleJob(task.label, cron_exp, (_date) => task('scheduled run'))
    return task
}

export function scheduleTasks() {
    // Offset is to combat Slack's rate limits
    const isProd = process.env.NODE_ENV === 'prod'

    tasks['Sync Sheet'] = scheduleTask(updateSheet, 60 * 5, isProd, 0)
    tasks['Announce Certs'] = scheduleTask(announceNewCerts, 60 * 60, isProd, 60) // Just in case the cert announcement isn't automatically run on changes
    tasks['Sync Usergroups'] = scheduleTask(updateSlackUsergroups, 60 * 60, isProd, 2 * 60)
    tasks['Link Fallback Photos'] = createTaskFunc(syncFallbackPhotos)
    tasks['Logout All'] = scheduleCronTask(createTaskFunc(logoutAll), '0 0 * * *')

    // Slack is silly and can only handle 5 items in the overflow menu
    scheduleCronTask(createTaskFunc(promptCheckinMessage), "0 9 * * SAT")
    scheduleTask(syncSlackMembers, 60 * 60, isProd, 0) // can be run from the admin members page
    scheduleTask(updateProfileCerts, 60 * 60 * 24, isProd, 5 * 60)
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
