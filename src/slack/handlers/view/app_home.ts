import { Blocks, Elements, HomeTab } from 'slack-block-builder'
import { ActionIDs } from '~slack/handlers'
import { getUserHoursBlocks } from '~slack/modals/user_hours'
import { getUserCertBlocks } from '~slack/modals/user_certs'
import { EventMiddleware } from '~slack/lib/types'

export const handleAppHomeOpened: EventMiddleware<'app_home_opened'> = async ({ body, event, client }) => {
    // Don't update when the messages tab is opened
    if (body.event.tab == 'home') {
        const homeTab = HomeTab().blocks(
            Blocks.Actions().elements(
                Elements.Button().text('Log Hours').actionId(ActionIDs.OPEN_LOG_MODAL),
                Elements.Button().text('Show Info').actionId(ActionIDs.OPEN_USERINFO_MODAL),
                Elements.Button().text('Send Pending Requests').actionId(ActionIDs.SEND_PENDING_REQUESTS)
            ),
            await getUserHoursBlocks({ slack_id: event.user }),
            Blocks.Divider(),
            await getUserCertBlocks({ slack_id: event.user }),
            Blocks.Divider(),
            Blocks.Context().elements('Last updated ' + new Date().toLocaleTimeString())
        )

        await client.views.publish({
            user_id: event.user,
            view: homeTab.buildToObject()
        })
    }
}
