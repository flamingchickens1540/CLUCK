import type { SlackCommandMiddlewareArgs, AllMiddlewareArgs } from '@slack/bolt'
import prisma from '@/lib/prisma'
import { completeHourLog } from '@/lib/hour_operations'

export async function handleLogoutCommand({ command, logger, ack, respond, client }: SlackCommandMiddlewareArgs & AllMiddlewareArgs) {
    await ack()
    const member = await prisma.member.findFirst({ where: { slack_id: command.user_id } })
    if (member) {
        try {
            const result = await completeHourLog(member.email, true)
            if (result.success) {
                await respond({ response_type: 'ephemeral', text: `Successfully cleared, you are no longer signed in` })
            } else {
                await respond({ response_type: 'ephemeral', text: result.msg })
            }
        } catch (e) {
            logger.error(e)
            await respond({ response_type: 'ephemeral', text: `Could not void hours: ${e}` })
            return
        }
    } else {
        await respond({ response_type: 'ephemeral', text: `I don't know who you are` })
        logger.error(`Could not find user ${command.user_id}`)
    }
}
