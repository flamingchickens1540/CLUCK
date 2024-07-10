import type { AllMiddlewareArgs, SlackEventMiddlewareArgs } from '@slack/bolt'
import type { KnownBlock, WebClient } from '@slack/web-api'
import { settingsButton } from '~slack/modals/settings'

export async function handleAppHomeOpened({ body, event, client }: SlackEventMiddlewareArgs<'app_home_opened'> & AllMiddlewareArgs) {
    // Don't update when the messages tab is opened
    if (body.event.tab == 'home') {
        await publishDefaultHomeView(event.user, client)
    }
}

export async function publishDefaultHomeView(user: string, client: WebClient) {
    await publishHomeView(user, client, [settingsButton])
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
