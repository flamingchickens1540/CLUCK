import prisma from '~lib/prisma'
import { enum_HourLogs_type, Prisma } from '@prisma/client'
import config from '~config'
import { slack_client } from '~slack'
import { getHourSubmissionMessage } from '~slack/blocks/admin/hour_submission'
import responses from '~slack/blocks/responses'
import logger from '~lib/logger'
import { getAppHome } from '~slack/blocks/app_home'
import { SlackMessageDto } from 'slack-block-builder'

export async function handleHoursRequest(slack_id: string, hours: number, activity: string) {
    const request: Prisma.HourLogCreateInput = {
        time_in: new Date(),
        type: 'external',
        state: 'pending',
        duration: new Prisma.Decimal(hours),
        message: activity,
        Member: {
            connect: {
                slack_id
            }
        }
    }

    const entry = await prisma.hourLog.create({ data: request })

    // Send request message to approvers
    const message = getHourSubmissionMessage({ slack_id, activity, hours, request_id: entry.id.toString(), state: 'pending' })
    const msg = await slack_client.chat.postMessage({ channel: config.slack.channels.approval, text: message.text, blocks: message.blocks })

    await slack_client.chat.postMessage({
        ...responses.submissionLoggedDM({ hours, activity, id: entry.id }),
        channel: slack_id
    })

    await prisma.hourLog.update({ where: { id: entry.id }, data: { slack_ts: msg.ts } })
}

export async function handleHoursResponse({
    action,
    request_id,
    type,
    response,
    actor_slack_id
}: {
    action: 'approve' | 'reject'
    request_id: number
    actor_slack_id: string
    type?: enum_HourLogs_type
    response: string | null
}): Promise<{ error?: unknown }> {
    const log = await prisma.hourLog.update({
        where: { id: request_id },
        data: {
            state: action == 'approve' ? 'complete' : 'cancelled',
            time_out: new Date(),
            type,
            response
        },
        include: { Member: { select: { slack_id: true } } }
    })
    if (!log) {
        logger.error({ request_id }, 'Could not find request info')
        return { error: 'Could not find request info' }
    }
    try {
        const message = getHourSubmissionMessage({
            slack_id: log.Member.slack_id!,
            activity: log.message!,
            hours: log.duration!.toNumber(),
            request_id: request_id.toString(),
            state: action == 'approve' ? 'approved' : 'rejected',
            response,
            type
        })
        await slack_client.chat.update({
            channel: config.slack.channels.approval,
            ts: log.slack_ts!,
            text: message.text,
            blocks: message.blocks
        })
        let dm: SlackMessageDto
        if (action == 'approve') {
            dm = responses.submissionAcceptedDM({
                slack_id: actor_slack_id,
                hours: log.duration!.toNumber(),
                activity: log.message!,
                message: log.response,
                request_id,
                type
            })
        } else {
            dm = responses.submissionRejectedDM({
                slack_id: actor_slack_id,
                hours: log.duration!.toNumber(),
                activity: log.message!,
                message: log.response!,
                request_id
            })
        }
        await slack_client.chat.postMessage({
            ...dm,
            channel: log.Member.slack_id!
        })
        await slack_client.views.publish({
            user_id: actor_slack_id,
            view: await getAppHome(actor_slack_id)
        })
        return {}
    } catch (err) {
        logger.error({ err, log }, 'Failed to handle accept modal')
        return { error: err }
    }
}
