import prisma from '~lib/prisma'
import { Prisma } from '@prisma/client'
import config from '~config'
import { slack_client } from '~slack'
import { getHourSubmissionMessage } from '~slack/modals/new_request'

export async function handleHoursRequest(slack_id: string, hrs: number, activity: string) {
    const member = await prisma.member.findUnique({ where: { slack_id } })
    if (member == null) {
        return
    }
    const request: Prisma.HourLogCreateInput = {
        time_in: new Date(),
        type: 'external',
        state: 'pending',
        duration: new Prisma.Decimal(hrs),
        message: activity,
        Member: {
            connect: {
                email: member.email
            }
        }
    }

    const entry = await prisma.hourLog.create({ data: request })

    // Send request message to approvers
    const message = getHourSubmissionMessage({ slack_id, activity, hours: hrs, request_id: entry.id.toString() })
    const msg = await slack_client.chat.postMessage({ channel: config.slack.channels.approval, text: message.text, blocks: message.blocks })

    await prisma.hourLog.update({ where: { id: entry.id }, data: { slack_ts: msg.ts } })
}
