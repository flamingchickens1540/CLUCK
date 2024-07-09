import type { SlackCommandMiddlewareArgs, AllMiddlewareArgs } from '@slack/bolt'
import prisma from '~lib/prisma'

export async function handleGetLoggedInCommand({ logger, ack, respond }: SlackCommandMiddlewareArgs & AllMiddlewareArgs) {
    await ack()
    try {
        const users = await prisma.hourLog.findMany({
            where: { state: 'pending', type: 'lab' },
            include: { Member: { select: { full_name: true } } }
        })
        const names = users.map((u) => u.Member.full_name)

        await respond({ response_type: 'ephemeral', text: users.length > 0 ? `*Currently Logged In:*\n${names.join('\n')}` : 'Nobody is logged in', mrkdwn: true })
    } catch (e) {
        logger.error(e)
        await respond({ response_type: 'ephemeral', text: `Could not get logged in users: ${e}` })
        return
    }
}
