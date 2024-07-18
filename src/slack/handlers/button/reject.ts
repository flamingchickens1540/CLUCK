import type { AllMiddlewareArgs, SlackViewMiddlewareArgs, ViewSubmitAction } from '@slack/bolt'
import type { ActionMiddleware } from '~slack/lib/types'
import { getRespondMessageModal } from '~slack/blocks/admin/respond'
import prisma from '~lib/prisma'
import { safeParseInt } from '~lib/util'
import { slack_client } from '~slack'
import config from '~config'
import { getHourSubmissionMessage } from '~slack/blocks/admin/hour_submission'
import responses from '~slack/blocks/responses'
import { getAppHome } from '~slack/blocks/app_home'

export const handleRejectButton: ActionMiddleware = async ({ ack, body, action, client, logger }) => {
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

export async function handleSubmitRejectModal({ ack, body, view, logger }: SlackViewMiddlewareArgs<ViewSubmitAction> & AllMiddlewareArgs) {
    await ack()
    const log = await prisma.hourLog.update({
        where: { id: safeParseInt(view.private_metadata) },
        data: { state: 'cancelled' },
        include: { Member: { select: { slack_id: true } } }
    })
    if (!log) {
        logger.error('Could not find request info ', safeParseInt(view.private_metadata))
    }
    try {
        const message = getHourSubmissionMessage({
            slack_id: log.Member.slack_id!,
            activity: log.message!,
            hours: log.duration!.toNumber(),
            request_id: log.id.toString(),
            state: 'rejected'
        })
        await slack_client.chat.update({
            channel: config.slack.channels.approval,
            ts: log.slack_ts!,
            text: message.text,
            blocks: message.blocks
        })
        const dm = responses.submissionRejectedDM({
            slack_id: body.user.id,
            hours: log.duration!.toNumber(),
            activity: log.message ?? 'Unknown',
            message: body.view.state.values.message.input.value ?? 'Unknown'
        })
        await slack_client.chat.postMessage({
            ...dm,
            channel: log.Member.slack_id!
        })
        await slack_client.views.publish({
            user_id: body.user.id,
            view: await getAppHome(body.user.id)
        })
    } catch (err) {
        logger.error('Failed to handle reject modal:\n' + err)
    }
}
