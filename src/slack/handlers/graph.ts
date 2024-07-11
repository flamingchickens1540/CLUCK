import type { AllMiddlewareArgs, SlackCommandMiddlewareArgs } from '@slack/bolt'
import { Blocks, Message } from 'slack-block-builder'
import { createHourChartForTeam, createHourChartForUsers } from '~slack/lib/chart'

export async function handleGraphCommand({ command, ack, respond, client }: SlackCommandMiddlewareArgs & AllMiddlewareArgs) {
    await ack({ response_type: 'ephemeral', text: 'Generating graph...' })

    const text = command.text.trim()
    const teamLabels = {
        all: 'all members',
        primary: 'Primary Team',
        junior: 'Junior Team'
    }
    const team = text as keyof typeof teamLabels
    if (teamLabels[team]) {
        const { url } = await createHourChartForTeam(text as keyof typeof teamLabels)
        const msg = Message()
            .blocks(
                Blocks.Section().text(':chart_with_upwards_trend: <@' + command.user_id + '> generated a graph for ' + teamLabels[team]),
                Blocks.Image().title('Hours Graph').imageUrl(url).altText('Hours Graph')
            )
            .buildToObject()
        await respond(msg)
        return
    }
    const users: Set<string> = new Set()
    const user_matches = text.matchAll(/<@(\w+)\|\w.+?>/g)
    for (const user of user_matches) {
        users.add(user[1])
    }

    if (users.size == 0) {
        await respond({ replace_original: true, response_type: 'ephemeral', text: 'No users specified' })
        return
    }

    const { url, success } = await createHourChartForUsers([...users])

    const msg = Message()
        .blocks(
            Blocks.Section().text(':chart_with_upwards_trend: <@' + command.user_id + '> generated a graph for ' + [...users].map((u) => '<@' + u + '>').join(', ')),
            Blocks.Image()
                .title(success ? 'Hours Graph' : 'You were hourless to stop me from making this pun')
                .imageUrl(url)
                .altText('Hours Graph')
        )
        .buildToObject()
    await respond(msg)
}
