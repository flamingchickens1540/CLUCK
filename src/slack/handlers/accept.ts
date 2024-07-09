import type { AllMiddlewareArgs, KnownBlock, SlackViewMiddlewareArgs, ViewSubmitAction } from '@slack/bolt'
import { formatDuration, sanitizeCodeblock } from '~slack/lib/messages'
import { ButtonActionMiddlewareArgs } from '~slack/lib/types'
import { getRespondMessageModal } from '~slack/modals/respond'
import prisma from '~lib/prisma'
import { safeParseInt } from '~lib/util'
import logger from '~lib/logger'
import { enum_HourLogs_type } from '@prisma/client'
import { slack_client } from '~slack'
import config from '~config'

export async function handleAcceptMessageButton({ ack, body, action, client, logger }: ButtonActionMiddlewareArgs & AllMiddlewareArgs) {
    await ack()
    const requestInfo = await prisma.hourLog.findUnique({ where: { id: safeParseInt(action.value) }, select: { id: true, message: true, duration: true, Member: { select: { first_name: true } } } })
    if (!requestInfo) {
        logger.error('Could not find request info')
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
            })
        })
    } catch (err) {
        logger.error('Failed to handle accept button:\n' + err)
    }
}

export async function handleAcceptModal({ ack, body, view, client }: SlackViewMiddlewareArgs<ViewSubmitAction> & AllMiddlewareArgs) {
    await ack()

    const request_id = safeParseInt(view.private_metadata)
    const requestInfo = await prisma.hourLog.findUnique({ where: { id: request_id }, select: { id: true, message: true, duration: true, slack_ts: true, Member: { select: { slack_id: true } } } })
    if (!requestInfo) {
        logger.error('Could not find request info')
        return
    }

    await client.chat.postMessage({ channel: requestInfo.Member.slack_id!, text: getAcceptedDm(body.user.id, requestInfo.duration!.toNumber(), requestInfo.message!, body.view.state.values.message.input.value) })
    await handleAccept({ id: requestInfo.id, duration: requestInfo.duration!.toNumber(), message: requestInfo.message!, slack_ts: requestInfo.slack_ts! }, (body.view.state.values.type_selector.selector.selected_option?.value as enum_HourLogs_type) ?? 'external')
}
export function getAcceptButtonHandler(prefix: enum_HourLogs_type) {
    return async function ({ ack, body, action, client }: ButtonActionMiddlewareArgs & AllMiddlewareArgs) {
        await ack()

        const requestInfo = await prisma.hourLog.findUnique({ where: { id: safeParseInt(action.value) }, select: { id: true, message: true, duration: true, slack_ts: true, Member: { select: { slack_id: true } } } })
        if (!requestInfo) {
            logger.error('Could not find request info')
            return
        }

        await client.chat.postMessage({ channel: requestInfo.Member.slack_id!, text: getAcceptedDm(body.user.id, requestInfo.duration!.toNumber(), requestInfo.message!) })
        await handleAccept({ id: requestInfo.id, duration: requestInfo.duration!.toNumber(), message: requestInfo.message!, slack_ts: requestInfo.slack_ts! }, prefix)
    }
}

async function handleAccept(time_request: { id: number; duration: number; message: string; slack_ts: string }, type: enum_HourLogs_type) {
    try {
        await prisma.hourLog.update({ where: { id: time_request.id }, data: { state: 'complete', type } })
    } catch {
        console.error('Failed to add hours with request', time_request)
        return
    }
    try {
        const message = (await slack_client.conversations.history({ channel: config.slack.users.request_approver, latest: time_request.slack_ts, limit: 1, inclusive: true })).messages![0]
        const oldBlocks = message.blocks! as KnownBlock[]
        await slack_client.chat.update({
            channel: config.slack.users.request_approver,
            ts: time_request.slack_ts,
            text: message.text + ' (ACCEPTED)',
            blocks: [
                oldBlocks[0],
                oldBlocks[1],
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*_:white_check_mark: Accepted ${new Date().toLocaleString()} :white_check_mark:_*`
                    }
                },
                { type: 'divider' }
            ]
        })
    } catch (err) {
        console.error('Failed to handle accept modal:\n' + err)
    }
}

const getAcceptedDm = (user: string, hours: number, activity: string, message: string | null = null) => {
    if (message != null) {
        return `:white_check_mark: *<@${user}>* accepted *${formatDuration(hours)}* :white_check_mark:\n>>>:person_climbing: *Activity:*\n\`${sanitizeCodeblock(activity)}\`\n:loudspeaker: *Message:*\n\`${sanitizeCodeblock(message)}\``
    }
    return `:white_check_mark: *<@${user}>* accepted *${formatDuration(hours)}* :white_check_mark:\n>>>:person_climbing: *Activity:*\n\`${sanitizeCodeblock(activity)}\``
}
