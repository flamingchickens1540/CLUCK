import type { ActionMiddleware, ViewMiddleware } from '~slack/lib/types'
import { getRespondMessageModal } from '~slack/blocks/admin/respond'
import prisma from '~lib/prisma'
import { safeParseInt } from '~lib/util'
import { enum_HourLogs_type } from '~prisma'
import { handleHoursResponse } from '~slack/lib/hours_submission'
import type { AllMiddlewareArgs, SlackViewMiddlewareArgs, ViewSubmitAction } from '@slack/bolt'
import { getPendingRequestMessage } from '~slack/blocks/admin/pending_requests'
import config from '~config'

export const handleHoursAcceptWithMessageButton: ActionMiddleware = async ({ ack, body, action, client, logger }) => {
    await ack()
    const requestInfo = await prisma.hourLog.findUnique({
        where: { id: safeParseInt(action.value) },
        select: { id: true, message: true, duration: true, Member: { select: { first_name: true } } }
    })
    if (!requestInfo) {
        logger.error({ action, name: 'handleAcceptWithMessageButton' }, 'Could not find request info')
        return
    }
    try {
        await client.views.open({
            trigger_id: body.trigger_id,
            view: getRespondMessageModal('Accept', {
                id: requestInfo.id,
                activity: requestInfo.message!,
                duration: requestInfo.duration!.toNumber(),
                first_name: requestInfo.Member.first_name
            }).buildToObject()
        })
    } catch (err) {
        logger.error({ err, info: requestInfo }, 'Failed to handle accept button')
    }
}

export const handleSubmitHoursAcceptModal: ViewMiddleware = async ({ ack, body, view }) => {
    await ack()
    await handleHoursResponse({
        action: 'approve',
        request_id: safeParseInt(view.private_metadata)!,
        actor_slack_id: body.user.id,
        type: view.state.values.type_selector.selector.selected_option?.value as enum_HourLogs_type,
        response: view.state.values.message.input.value as string
    })
}

export function createHoursAcceptButtonHandler(type: enum_HourLogs_type): ActionMiddleware {
    return async ({ ack, action, body }) => {
        await ack()
        await handleHoursResponse({ action: 'approve', request_id: safeParseInt(action.value)!, actor_slack_id: body.user.id, type, response: null })
    }
}

export const handleHoursRejectButton: ActionMiddleware = async ({ ack, body, action, client, logger }) => {
    await ack()
    const requestInfo = await prisma.hourLog.findUnique({
        where: { id: safeParseInt(action.value) },
        select: { id: true, message: true, duration: true, Member: { select: { first_name: true } } }
    })
    if (!requestInfo) {
        logger.error('Could not find request info')
        return
    }
    try {
        await client.views.open({
            trigger_id: body.trigger_id,
            view: getRespondMessageModal('Reject', {
                id: requestInfo.id,
                activity: requestInfo.message!,
                duration: requestInfo.duration!.toNumber(),
                first_name: requestInfo.Member.first_name
            }).buildToObject()
        })
    } catch (err) {
        logger.error('Failed to handle reject button:\n' + err)
    }
}

export async function handleSubmitHoursRejectModal({ respond, ack, body, view, logger }: SlackViewMiddlewareArgs<ViewSubmitAction> & AllMiddlewareArgs) {
    await ack()

    const response = body.view.state.values?.message?.input?.value ?? 'Unknown'

    const { error } = await handleHoursResponse({ action: 'reject', request_id: safeParseInt(view.private_metadata)!, actor_slack_id: body.user.id, response })
    if (error) {
        logger.error({ error }, 'Failed to handle reject modal')
        await respond({ response_type: 'ephemeral', text: error.toString() })
        return
    }
}

export const handleSendPendingRequestsButton: ActionMiddleware = async ({ ack, client, body }) => {
    await ack()

    const msg = await getPendingRequestMessage({ team_id: body.team!.id, app_id: body.api_app_id })
    await client.chat.postMessage({
        ...msg,
        channel: config.slack.channels.approval
    })
}
