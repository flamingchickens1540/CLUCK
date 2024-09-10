import { Prisma } from '@prisma/client'
import config from '~lib/config'
import logger from '~lib/logger'
import prisma from '~lib/prisma'
import { emitCluckChange } from '~lib/sockets'
import { slack_client } from '~slack'
import responses from '~slack/blocks/responses'

export async function promptCheckinMessage() {
    await slack_client.chat.postMessage({
        channel: config.slack.channels.checkin,
        text: "<!channel> it's that time again! Make a checkin post"
    })
}

export async function logoutAll() {
    const loggedIn = await prisma.hourLog.findMany({
        where: {
            state: 'pending',
            type: 'lab'
        },
        select: { time_in: true, Member: { select: { slack_id: true, email: true } } }
    })
    for (const log of loggedIn) {
        try {
            const slack_id = log.Member.slack_id
            emitCluckChange({ email: log.Member.email, logging_in: false })
            if (slack_id) {
                await slack_client.chat.postMessage({
                    ...responses.autoSignoutDM({ slack_id, time_in: log.time_in }),
                    channel: slack_id
                })
            }
        } catch (e) {
            logger.warn(e)
        }
    }
    await prisma.hourLog.updateMany({
        where: {
            state: 'pending',
            type: 'lab'
        },
        data: {
            state: 'cancelled',
            time_out: new Date(),
            duration: new Prisma.Decimal(0)
        }
    })
}
