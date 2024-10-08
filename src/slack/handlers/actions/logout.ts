import prisma from '~lib/prisma'
import { completeHourLog, HourError } from '~lib/hour_operations'
import { CommandMiddleware } from '~slack/lib/types'

export const handleLogoutCommand: CommandMiddleware = async ({ command, logger, ack, respond }) => {
    await ack()
    const member = await prisma.member.findUnique({ where: { slack_id: command.user_id } })
    if (member) {
        try {
            const result = await completeHourLog(member.email, true)
            if (result.success) {
                await respond({ response_type: 'ephemeral', text: `Successfully cleared, you are no longer signed in` })
            } else if (result.error == HourError.NOT_SIGNED_IN) {
                await respond({ response_type: 'ephemeral', text: 'You are not signed in' })
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
