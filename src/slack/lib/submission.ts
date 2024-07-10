import prisma from '~lib/prisma'
import { Prisma } from '@prisma/client'
import config from '~config'
import { slack_client } from '~slack'
import { getSubmittedAltText } from '~slack/lib/messages'
import { getRequestBlocks } from '~slack/modals/new_request'

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
    const blocks = getRequestBlocks(slack_id, hrs, activity, entry.id.toString())

    const message = await slack_client.chat.postMessage({ channel: config.slack.channels.approval, text: getSubmittedAltText(member.first_name, hrs, activity), blocks: blocks })

    await prisma.hourLog.update({ where: { id: entry.id }, data: { slack_ts: message.ts } })
}
