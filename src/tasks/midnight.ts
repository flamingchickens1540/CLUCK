import schedule from 'node-schedule'
import prisma from '~lib/prisma'
import { slack_client } from '~slack'
import responses from '~slack/blocks/responses'

export function setupAutoLogout() {
    schedule.scheduleJob('Midnight Logout', '0 0 * * *', async (date) => {
        const loggedIn = await prisma.hourLog.findMany({
            where: {
                state: 'pending',
                type: 'lab'
            },
            select: { time_in: true, Member: { select: { slack_id: true } } }
        })
        for (const log of loggedIn) {
            const slack_id = log.Member.slack_id
            if (slack_id) {
                await slack_client.chat.postMessage({
                    ...responses.autoSignoutDM({ slack_id, time_in: log.time_in }),
                    channel: log.Member.slack_id
                })
            }
        }
    })
}
