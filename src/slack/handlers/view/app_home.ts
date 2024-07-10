import type { AllMiddlewareArgs, SlackEventMiddlewareArgs } from '@slack/bolt'
import type { KnownBlock, SectionBlock, WebClient } from '@slack/web-api'
import { settingsButton } from '~slack/modals/settings'
import prisma from '~lib/prisma'
import { calculateHours } from '~lib/hour_operations'

export async function handleAppHomeOpened({ body, event, client }: SlackEventMiddlewareArgs<'app_home_opened'> & AllMiddlewareArgs) {
    // Don't update when the messages tab is opened
    if (body.event.tab == 'home') {
        await publishDefaultHomeView(event.user, client)
    }
}

export async function publishDefaultHomeView(user: string, client: WebClient) {
    const hours = (await calculateHours({ slack_id: user }))!
    const createTableRow = (colA: string, colB: string): KnownBlock[] => [
        {
            fields: [
                {
                    text: colA,
                    type: 'mrkdwn'
                },
                {
                    text: colB,
                    type: 'mrkdwn'
                }
            ],
            type: 'section'
        },
        {
            type: 'divider'
        }
    ]
    const hoursBlocks: KnownBlock[] = [
        {
            text: {
                emoji: true,
                text: '💰 Your Hours',
                type: 'plain_text'
            },
            type: 'header'
        }
    ]
    hoursBlocks.push(...createTableRow('*Category*', '*Hours*'))
    hoursBlocks.push(...createTableRow('Lab', hours.lab.toFixed(1)))
    hoursBlocks.push(...createTableRow('External', hours.external.toFixed(1)))
    hoursBlocks.push(...createTableRow('Event', hours.event.toFixed(1)))
    hoursBlocks.push(...createTableRow('Summer', hours.summer.toFixed(1)))
    hoursBlocks.push(...createTableRow('*Total*', '*' + hours.total.toFixed(1) + '*'))

    await publishHomeView(user, client, [settingsButton, ...hoursBlocks])
}

export async function publishHomeView(user: string, client: WebClient, blocks: KnownBlock[]) {
    await client.views.publish({
        user_id: user,
        view: {
            type: 'home',
            blocks
        }
    })
}
