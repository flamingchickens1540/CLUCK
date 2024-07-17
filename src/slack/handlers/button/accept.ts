import type { AllMiddlewareArgs, SlackViewMiddlewareArgs, ViewSubmitAction } from '@slack/bolt'
import { ButtonActionMiddlewareArgs } from '~slack/lib/types'
import { getRespondMessageModal } from '~slack/modals/respond'
import prisma from '~lib/prisma'
import { safeParseInt } from '~lib/util'
import logger from '~lib/logger'
import { enum_HourLogs_type } from '@prisma/client'
import { slack_client } from '~slack'
import config from '~config'
import { getHourSubmissionMessage } from '~slack/messages/new_request'
import responses from '~slack/messages/responses'

export async function handleAcceptWithMessageButton({ ack, body, action, client, logger }: ButtonActionMiddlewareArgs & AllMiddlewareArgs) {
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
            view: getRespondMessageModal('Accept', {
                id: requestInfo.id,
                activity: requestInfo.message!,
                duration: requestInfo.duration!.toNumber(),
                first_name: requestInfo.Member.first_name
            }).buildToObject()
        })
    } catch (err) {
        logger.error('Failed to handle accept button:\n' + err)
    }
}

export async function handleAcceptModal({ ack, body, view }: SlackViewMiddlewareArgs<ViewSubmitAction> & AllMiddlewareArgs) {
    await ack()
    await handleAccept(safeParseInt(view.private_metadata) ?? -1, body.user.id, body.view.state.values.message.input.value as enum_HourLogs_type)
}

export function getAcceptButtonHandler(prefix: enum_HourLogs_type) {
    return async function ({ ack, action, body }: ButtonActionMiddlewareArgs & AllMiddlewareArgs) {
        await ack()
        await handleAccept(safeParseInt(action.value) ?? -1, body.user.id, prefix)
    }
}

async function handleAccept(request_id: number, actor_slack_id: string, type: enum_HourLogs_type) {
    const log = await prisma.hourLog.update({
        where: { id: request_id },
        data: { state: 'complete', type },
        include: { Member: { select: { slack_id: true } } }
    })
    if (!log) {
        logger.error('Could not find request info ', request_id)
        return false
    }
    try {
        const message = getHourSubmissionMessage({
            slack_id: log.Member.slack_id!,
            activity: log.message!,
            hours: log.duration!.toNumber(),
            request_id: request_id.toString(),
            state: 'approved',
            type
        })
        await slack_client.chat.update({
            channel: config.slack.channels.approval,
            ts: log.slack_ts!,
            text: message.text,
            blocks: message.blocks
        })
        const dm = responses.submissionAcceptedDM({
            slack_id: actor_slack_id,
            hours: log.duration!.toNumber(),
            activity: log.message!
        })
        await slack_client.chat.postMessage({
            ...dm,
            channel: log.Member.slack_id!
        })
        return true
    } catch (err) {
        logger.error('Failed to handle accept modal:\n' + err)
        return false
    }
}
