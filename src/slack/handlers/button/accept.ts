import { ActionMiddleware, ViewMiddleware } from '~slack/lib/types'
import { getRespondMessageModal } from '~slack/blocks/admin/respond'
import prisma from '~lib/prisma'
import { safeParseInt } from '~lib/util'
import logger from '~lib/logger'
import { enum_HourLogs_type } from '@prisma/client'
import { slack_client } from '~slack'
import config from '~config'
import { getHourSubmissionMessage } from '~slack/blocks/admin/hour_submission'
import responses from '~slack/blocks/responses'
import { getAppHome } from '~slack/blocks/app_home'

export const handleAcceptWithMessageButton: ActionMiddleware = async ({ ack, body, action, client, logger }) => {
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

export const handleSubmitAcceptModal: ViewMiddleware = async ({ ack, body, view }) => {
    await ack()
    await handleAccept(
        safeParseInt(view.private_metadata) ?? -1,
        body.user.id,
        body.view.state.values.type_selector.selector.selected_option?.value as enum_HourLogs_type,
        body.view.state.values.message.input.value as string
    )
}

export function getAcceptButtonHandler(prefix: enum_HourLogs_type): ActionMiddleware {
    return async ({ ack, action, body }) => {
        await ack()
        await handleAccept(safeParseInt(action.value) ?? -1, body.user.id, prefix, null)
    }
}

async function handleAccept(request_id: number, actor_slack_id: string, type: enum_HourLogs_type, response: string | null) {
    const log = await prisma.hourLog.update({
        where: { id: request_id },
        data: { state: 'complete', type, response },
        include: { Member: { select: { slack_id: true } } }
    })
    if (!log) {
        logger.error({ request_id }, 'Could not find request info')
        return false
    }
    try {
        const message = getHourSubmissionMessage({
            slack_id: log.Member.slack_id!,
            activity: log.message!,
            hours: log.duration!.toNumber(),
            request_id: request_id.toString(),
            state: 'approved',
            response,
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
            activity: log.message!,
            message: log.response,
            request_id,
            type
        })
        await slack_client.chat.postMessage({
            ...dm,
            channel: log.Member.slack_id!
        })
        await slack_client.views.publish({
            user_id: actor_slack_id,
            view: await getAppHome(actor_slack_id)
        })
        return true
    } catch (err) {
        logger.error({ err, log }, 'Failed to handle accept modal')
        return false
    }
}
