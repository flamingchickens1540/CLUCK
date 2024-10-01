import { Blocks, Message } from 'slack-block-builder'
import { getManagers } from '~lib/cert_operations'
import config from '~lib/config'
import logger from '~lib/logger'
import { formatList } from '~slack/lib/messages'
import { EventMiddleware } from '~slack/lib/types'

export const handleAppMentioned: EventMiddleware<'app_mention'> = async ({ event, client }) => {
    if (event.channel == config.slack.channels.checkin) {
        await client.reactions.add({
            channel: event.channel,
            timestamp: event.ts,
            name: 'stopwatch'
        })
        const user = await client.auth.test()

        const dept_managers = await getManagers()

        for (const manager_dept of dept_managers) {
            if (manager_dept.managers.length == 0) {
                logger.warn('No manager slack ids for dept ' + manager_dept.dept.name)
                continue
            }
            const dm = await client.conversations.open({
                users: [...config.slack.users.copres, ...manager_dept.managers].join(',')
            })
            if (dm.channel?.id == null) {
                logger.warn('No group dm for dept ' + manager_dept.dept.name)
                continue
            }
            const text = event.text.replace('<@' + user.user_id! + '>', formatList(manager_dept.managers.map((id) => '<@' + id + '>')))
            await client.chat.postMessage({
                channel: dm.channel!.id!,
                text,
                blocks: Message()
                    .blocks(Blocks.Section().text(text), Blocks.Context().elements('Copresident Checkin for ' + manager_dept.dept.name))
                    .buildToObject().blocks
            })
        }
        await client.reactions.remove({
            channel: event.channel,
            timestamp: event.ts,
            name: 'stopwatch'
        })
        await client.reactions.add({
            channel: event.channel,
            timestamp: event.ts,
            name: 'white_check_mark'
        })
    }
}
