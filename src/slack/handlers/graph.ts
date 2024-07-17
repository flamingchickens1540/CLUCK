import { Blocks, Message } from 'slack-block-builder'
import { createHourChartForTeam, createHourChartForUsers } from '~slack/lib/chart'
import { formatList } from '~slack/lib/messages'
import { CommandMiddleware } from '~slack/lib/types'

export const handleGraphCommand: CommandMiddleware = async ({ command, ack, respond }) => {
    await ack()
    const text = command.text.trim()
    const teamLabels = {
        all: 'all members',
        primary: 'Senior Team',
        junior: 'Junior Team'
    }
    const team = text as keyof typeof teamLabels

    const resp = { text: '', url: '', title: 'Hours Graph' }
    await respond({ response_type: 'ephemeral', text: 'Generating graph...' })
    if (teamLabels[team]) {
        const { url, success } = await createHourChartForTeam(text as keyof typeof teamLabels)
        resp.text = ':chart_with_upwards_trend: <@' + command.user_id + '> generated a graph for ' + teamLabels[team]
        resp.title = success ? 'Hours Graph' : 'You were hourless to stop me from making this pun'
        resp.url = url
    } else {
        const users: Set<string> = new Set()
        const user_matches = text.matchAll(/<@(\w+)\|\w.+?>/g)
        for (const user of user_matches) {
            users.add(user[1])
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
