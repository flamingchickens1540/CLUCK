import type { AllMiddlewareArgs, SlackEventMiddlewareArgs } from '@slack/bolt'
import type { WebClient } from '@slack/web-api'
import { Blocks, Elements, HomeTab } from 'slack-block-builder'
import { calculateHours } from '~lib/hour_operations'
import { ActionIDs } from '~slack/handlers'
import { getUserHoursBlocks } from '~slack/modals/user_hours'

export async function handleAppHomeOpened({ body, event, client }: SlackEventMiddlewareArgs<'app_home_opened'> & AllMiddlewareArgs) {
    // Don't update when the messages tab is opened
    if (body.event.tab == 'home') {
        await publishDefaultHomeView(event.user, client)
    }
}

export async function publishDefaultHomeView(user: string, client: WebClient) {
    const homeTab = HomeTab().blocks(
        Blocks.Actions().elements(
            Elements.Button().text('Log Hours').actionId(ActionIDs.OPEN_LOG_MODAL),
            Elements.Button().text('Show Info').actionId(ActionIDs.OPEN_USERINFO_MODAL),
            Elements.Button().text('Send Pending Requests').actionId(ActionIDs.SEND_PENDING_REQUESTS)
        ),
        await getUserHoursBlocks({ slack_id: user })
    )

    await client.views.publish({
        user_id: user,
        view: homeTab.buildToObject()
    })
}
