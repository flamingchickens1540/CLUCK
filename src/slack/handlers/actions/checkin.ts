import { Blocks, Elements, Message } from 'slack-block-builder'
import config from '~lib/config'
import logger from '~lib/logger'
import prisma from '~lib/prisma'
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

        const departments = await prisma.department.findMany({
            select: {
                name: true,
                Certs: {
                    where: {
                        isManager: true
                    },
                    select: {
                        Instances: {
                            select: {
                                Member: {
                                    select: {
                                        email: true,
                                        slack_id: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        const dept_managers = departments.map((dept) => ({
            name: dept.name,
            managers: dept.Certs.flatMap((cert) => cert.Instances.map((instance) => instance.Member.slack_id).filter((v) => v != null))
        }))

        for (const dept of dept_managers) {
            if (dept.managers.length == 0) {
                logger.warn('No manager slack ids for dept ' + dept.name)
                continue
            }
            const dm = await client.conversations.open({
                users: [...config.slack.users.copres, ...dept.managers].join(',')
            })
            if (dm.channel?.id == null) {
                logger.warn('No group dm for dept ' + dept.name)
                continue
            }
            const text = event.text.replace('<@' + user.user_id! + '>', formatList(dept.managers.map((id) => '<@' + id + '>')))
            await client.chat.postMessage({
                channel: dm.channel!.id!,
                text,
                blocks: Message()
                    .blocks(Blocks.Section().text(text), Blocks.Context().elements('Copresident Checkin for ' + dept.name))
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
