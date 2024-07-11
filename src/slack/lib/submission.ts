import prisma from '~lib/prisma'
import { Prisma } from '@prisma/client'
import config from '~config'
import { slack_client } from '~slack'
import { getHourSubmissionMessage } from '~slack/modals/new_request'
import { slackResponses } from '~slack/lib/messages'

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
        channel: slack_id,
        text: slackResponses.submissionLoggedDM({ hours, activity })
    })

    await prisma.hourLog.update({ where: { id: entry.id }, data: { slack_ts: msg.ts } })
}
