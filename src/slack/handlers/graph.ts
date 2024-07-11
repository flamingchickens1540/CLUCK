import type { AllMiddlewareArgs, SlackCommandMiddlewareArgs, KnownBlock } from '@slack/bolt'
import { createHoursChart } from '~slack/lib/chart'

export async function handleGraphCommand({ command, ack, respond, client }: SlackCommandMiddlewareArgs & AllMiddlewareArgs) {
    await ack({ response_type: 'ephemeral', text: 'Generating graph...' })

    const users: Set<string> = new Set()
    const user_matches = command.text.matchAll(/<@(\w+)\|\w.+?>/g)
    for (const user of user_matches) {
        users.add(user[1])
    }

    if (users.size == 0) {
        await respond({ replace_original: true, response_type: 'ephemeral', text: 'No users specified' })
        return
    }

    const url = await createHoursChart([...users])

    await respond({
        text: 'Hours graph',
        blocks: getGraphBlocks(url, command.user_id, [...users]),
        response_type: command.channel_id.startsWith('D') ? 'in_channel' : 'ephemeral'
    })
    // createChart([...users].map((id) => ({ slack_id: id })))
    //     .then(async (image_url) => {
    //
    //     })
    //     .catch(async (e) => {
    //         console.log(e)
    //         await respond({ replace_original: true, response_type: 'ephemeral', text: 'Could not generate graph!' })
    //     })
}

const getGraphBlocks = (image_url: string, user_id: string, names: string[]): KnownBlock[] => {
    return [
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `:chart_with_upwards_trend: <@${user_id}> generated a graph for ${names.map((n) => `<@${n}>`).join(', ')}`
            }
        },
        {
            type: 'image',
            image_url: image_url,
            alt_text: 'hour graph'
        }
    ]
}
