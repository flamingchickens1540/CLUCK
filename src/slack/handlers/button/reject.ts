import type { AllMiddlewareArgs, KnownBlock, SlackViewMiddlewareArgs, ViewSubmitAction } from '@slack/bolt'
import type { ButtonActionMiddlewareArgs } from '~slack/lib/types'
import { formatDuration, sanitizeCodeblock } from '~slack/lib/messages'
import { getRespondMessageModal } from '~slack/modals/respond'
import prisma from '~lib/prisma'
import { safeParseInt } from '~lib/util'
import { slack_client } from '~slack'
import config from '~config'
import logger from '~lib/logger'
import { Decimal } from '@prisma/client/runtime/library'

export async function handleRejectButton({ ack, body, action, client, logger }: ButtonActionMiddlewareArgs & AllMiddlewareArgs) {
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
            })
        })
    } catch (err) {
        logger.error('Failed to handle reject button:\n' + err)
    }
}

export async function handleRejectModal({ ack, body, view, client, logger }: SlackViewMiddlewareArgs<ViewSubmitAction> & AllMiddlewareArgs) {
    await ack()
    const time_request = await prisma.hourLog.findUnique({
        where: { id: safeParseInt(view.private_metadata) },
        select: { id: true, message: true, duration: true, slack_ts: true, Member: { select: { slack_id: true } } }
    })
    if (!time_request) {
        logger.error('Could not find request info')
        return
    }
    await prisma.hourLog.update({ where: { id: time_request.id }, data: { state: 'cancelled', type: 'external' } })

    try {
        const message = (
            await slack_client.conversations.history({
                channel: config.slack.channels.approval,
                latest: time_request.slack_ts!,
                limit: 1,
                inclusive: true
            })
        ).messages![0]
        const oldBlocks = message.blocks! as KnownBlock[]
        await slack_client.chat.update({
            channel: config.slack.channels.approval,
            ts: time_request.slack_ts!,
            text: message.text + ' (REJECTED)',
            blocks: [
                oldBlocks[0],
                oldBlocks[1],
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*_:x: Rejected ${new Date().toLocaleString()} :x:_*`
                    }
                },
                { type: 'divider' }
            ]
        })
        await client.chat.postMessage({
            channel: time_request.Member.slack_id!,
            text: getRejectedDm(body.user.id, time_request.duration!.toNumber(), time_request.message ?? 'Unknown', body.view.state.values.message.input.value ?? 'Unknown')
        })
    } catch (err) {
        console.error('Failed to handle reject modal:\n' + err)
    }
}

const getRejectedDm = (user: string, hours: number, activity: string, message: string) => {
    return `:x: *<@${user}>* rejected *${formatDuration(hours)}* :x:\n>>>:person_climbing: *Activity:*\n\`${sanitizeCodeblock(activity)}\`\n:loudspeaker: *Message:*\n\`${sanitizeCodeblock(message)}\``
}
