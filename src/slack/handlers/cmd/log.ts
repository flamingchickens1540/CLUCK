import type { AllMiddlewareArgs, SlackCommandMiddlewareArgs, SlackShortcutMiddlewareArgs, SlackViewMiddlewareArgs, ViewSubmitAction } from '@slack/bolt'
import type { WebClient } from '@slack/web-api'

import { slackResponses } from '~slack/lib/messages'
import log_modal from '~slack/modals/log'
import { safeParseFloat } from '~lib/util'
import { handleHoursRequest } from '~slack/lib/submission'

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

export async function handleLogCommand({ command, logger, ack, respond, client }: SlackCommandMiddlewareArgs & AllMiddlewareArgs) {
    await ack()

    if (command.text.trim().length === 0) {
        await client.views.open({
            view: log_modal,
            trigger_id: command.trigger_id
        })
    } else {
        const { hours, activity } = parseArgs(command.text.trim())
        if (activity == '' || activity == undefined) {
            await respond({ response_type: 'ephemeral', text: slackResponses.noActivitySpecified() })
            return
        }
        try {
            if (hours < 0.1) {
                await respond({ response_type: 'ephemeral', text: slackResponses.tooFewHours() })
            } else {
                await respond({ response_type: 'ephemeral', text: slackResponses.submissionLogged() })
                await client.chat.postMessage({
                    channel: command.user_id,
                    text: slackResponses.submissionLoggedDM({ hours, activity })
                })
                await handleHoursRequest(command.user_id, hours, activity)
            }
        } catch (err) {
            logger.error('Failed to complete log command:\n' + err)
        }
    }
}

export async function handleLogShortcut({
    shortcut,
    ack,
    client
}: SlackShortcutMiddlewareArgs & {
    client: WebClient
}) {
    await ack()

    await client.views.open({
        view: log_modal,
        trigger_id: shortcut.trigger_id
    })
}

export async function handleLogModal({ ack, body, view, client, logger }: SlackViewMiddlewareArgs<ViewSubmitAction> & AllMiddlewareArgs) {
    await ack()

    // Get the hours and task from the modal
    let hours = parseFloat(view.state.values.hours.hours.value ?? '0')
    const activity = view.state.values.task.task.value ?? 'Unknown'

    // Ensure the time values are valid
    hours = isNaN(hours) ? 0 : hours

    if (hours > 0.1) {
        try {
            await client.chat.postMessage({
                channel: body.user.id,
                text: slackResponses.submissionLoggedDM({ hours, activity })
            })
        } catch (err) {
            logger.error('Failed to handle log modal:\n' + err)
        }
        await handleHoursRequest(body.user.id, hours, activity)
    } else {
        await client.chat.postMessage({ channel: body.user.id, text: slackResponses.tooFewHours() })
    }
}
