import type { AllMiddlewareArgs, SlackCommandMiddlewareArgs, SlackShortcutMiddlewareArgs, SlackViewMiddlewareArgs, ViewSubmitAction } from '@slack/bolt'
import type { WebClient } from '@slack/web-api'

import log_modal from '~slack/modals/log'
import { safeParseFloat } from '~lib/util'
import { handleHoursRequest } from '~slack/lib/submission'
import type { ButtonActionMiddlewareArgs } from '~slack/lib/types'
import responses from '~slack/messages/responses'

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

export async function handleLogCommand({ command, logger, ack, client }: SlackCommandMiddlewareArgs & AllMiddlewareArgs) {
    if (command.text.trim().length === 0) {
        await ack()
        await client.views.open({
            view: log_modal,
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

export async function handleLogShortcut({ shortcut, ack, client }: SlackShortcutMiddlewareArgs & { client: WebClient }) {
    await ack()

    await client.views.open({
        view: log_modal,
        trigger_id: shortcut.trigger_id
    })
}
export async function handleOpenLogModal({ body, ack, client }: ButtonActionMiddlewareArgs & { client: WebClient }) {
    await ack()

    await client.views.open({
        view: log_modal,
        trigger_id: body.trigger_id
    })
}

export async function handleLogModal({ ack, body, view, client }: SlackViewMiddlewareArgs<ViewSubmitAction> & AllMiddlewareArgs) {
    // Get the hours and task from the modal
    let hours = safeParseFloat(view.state.values.hours.hours.value) ?? parseArgs(view.state.values.hours.hours.value ?? '').hours
    const activity = view.state.values.task.task.value

    // Ensure the time values are valid
    hours = isNaN(hours) ? 0 : hours
    if (hours < 0.1) {
        await ack({ response_action: 'errors', errors: { hours: 'Please enter a valid duration' } })
        return
    }
    if (activity?.trim() == '' || activity == undefined) {
        await ack({ response_action: 'errors', errors: { task: 'Please enter an activity' } })
        return
    }

    await ack()
    await handleHoursRequest(body.user.id, hours, activity)
}
