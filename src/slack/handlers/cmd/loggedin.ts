import prisma from '~lib/prisma'
import { CommandMiddleware } from '~slack/lib/types'

export const handleGetLoggedInCommand: CommandMiddleware = async ({ logger, ack, respond }) => {
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
