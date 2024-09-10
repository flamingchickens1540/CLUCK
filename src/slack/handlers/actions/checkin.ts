import config from "~lib/config"
import logger from "~lib/logger"
import prisma from "~lib/prisma"
import { EventMiddleware } from "~slack/lib/types"

export const handleAppMentioned: EventMiddleware<'app_mention'> = async ({ event, client }) => {
    if (event.channel == config.slack.channels.checkin) {
        await client.reactions.add({
            channel: event.channel,
            timestamp: event.ts,
            name: "stopwatch"
        })
        const user = await client.auth.test()
        const managers = await prisma.member.findMany({where: {MemberCerts: {some: {Cert: {isManager: true}}}}})
        const copres_string = config.slack.users.copres.join(",")
        for (const manager of managers) {
            if (!manager.slack_id) {
                logger.warn("No slack id for manager "+manager.email)
                continue
            }
            const dm = await client.conversations.open({
                users: copres_string+","+manager.slack_id,
            })
            if (dm.channel?.id == null) {
                logger.warn("No group dm for manager "+manager.email)
                continue
            }
            await client.chat.postMessage({
                channel:dm.channel!.id!,
                text: event.text.replace(user.user_id!, manager.slack_id)
            })
        }
        await client.reactions.remove({
            channel: event.channel,
            timestamp: event.ts,
            name: "stopwatch"
        })
        await client.reactions.add({
            channel: event.channel,
            timestamp: event.ts,
            name: "white_check_mark"
        })
    }
}
