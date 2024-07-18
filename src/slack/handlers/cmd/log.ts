import { getLogModal } from '~slack/blocks/log'
import { safeParseFloat } from '~lib/util'
import { handleHoursRequest } from '~slack/lib/submission'
import responses from '~slack/blocks/responses'
import { CommandMiddleware, ShortcutMiddleware } from '~slack/lib/types'

export function parseArgs(text: string): { hours: number; activity: string | undefined } {
    const timeRegex = /^(?:([\d.]+)h)? ?(?:([\d.]+)m)? (.+)$/
    if (!timeRegex.test(text)) {
        return { hours: 0, activity: undefined }
    }
    const m = timeRegex.exec(text)!
    const msg = m[3]
    const hours = safeParseFloat(m[1]) ?? 0
    const minutes = safeParseFloat(m[2]) ?? 0

    return {
        hours: hours + minutes / 60,
        activity: msg
    }
}

export const handleLogCommand: CommandMiddleware = async ({ command, logger, ack, client }) => {
    if (command.text.trim().length === 0) {
        await ack()
        await client.views.open({
            view: getLogModal(),
            trigger_id: command.trigger_id
        })
    } else {
        const { hours, activity } = parseArgs(command.text.trim())
        if (activity == '' || activity == undefined) {
            await ack({ ...responses.noActivitySpecified(), response_type: 'ephemeral' })
            return
        }
        try {
            if (hours < 0.1) {
                await ack({ ...responses.tooFewHours(), response_type: 'ephemeral' })
            } else {
                await ack({ ...responses.submissionLogged(), response_type: 'ephemeral' })
                await handleHoursRequest(command.user_id, hours, activity)
            }
        } catch (err) {
            logger.error('Failed to complete log command:\n' + err)
        }
    }
}

export const handleLogShortcut: ShortcutMiddleware = async ({ shortcut, ack, client }) => {
    await ack()

    await client.views.open({
        view: getLogModal(),
        trigger_id: shortcut.trigger_id
    })
}
