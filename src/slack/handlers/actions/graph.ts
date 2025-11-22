import { Blocks, Message } from 'slack-block-builder'
import { createHourChartForTeam, createHourChartForUsers } from '~slack/lib/chart'
import { formatList } from '~slack/lib/messages'
import { CommandMiddleware } from '~slack/lib/types'
import prisma from '~lib/prisma'
import { SLACK_GROUP_REGEX, SLACK_USER_REGEX } from '~lib/util'

export const handleGraphCommand: CommandMiddleware = async ({ command, ack, respond }) => {
    await ack()
    const text = command.text.trim()

    const resp = { text: '', url: '', title: 'Hours Graph' }
    await respond({ response_type: 'ephemeral', text: 'Generating graph...' })
    if (text == 'all') {
        const { url, success } = await createHourChartForTeam()
        resp.text = ':chart_with_upwards_trend: <@' + command.user_id + '> generated a graph for the team'
        resp.title = success ? 'Hours Graph' : 'You were hourless to stop me from making this pun'
        resp.url = url
    } else {
        const users: Set<string> = new Set()
        const user_matches = text.matchAll(SLACK_USER_REGEX)
        const group_matches = text.matchAll(SLACK_GROUP_REGEX)
        for (const user of user_matches) {
            users.add(user[1])
        }
        for (const group of group_matches) {
            const associations = await prisma.departmentAssociation.findMany({
                where: { Department: { slack_group: group[1] } },
                select: { Member: { select: { slack_id: true } } }
            })
            associations.forEach((a) => {
                if (a.Member.slack_id) {
                    users.add(a.Member.slack_id)
                }
            })
        }

        if (users.size == 0) {
            users.add(command.user_id)
        }

        const { url, success } = await createHourChartForUsers([...users])
        resp.url = url
        resp.title = success ? 'Hours Graph' : 'You were hourless to stop me from making this pun'
        resp.text = ':chart_with_upwards_trend: <@' + command.user_id + '> generated a graph for ' + formatList([...users].map((u) => `<@${u}>`))
    }
    const msg = Message()
        .text(resp.text)
        .blocks(Blocks.Section().text(resp.text), Blocks.Image().title(resp.title).imageUrl(resp.url).altText('Hours Graph'))
        .inChannel()
        .buildToObject()
    await respond(msg)
}
