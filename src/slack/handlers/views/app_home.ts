import { EventMiddleware } from '~slack/lib/types'
import { getAppHome } from '~slack/blocks/app_home'

export const handleAppHomeOpened: EventMiddleware<'app_home_opened'> = async ({ body, event, client }) => {
    // Don't update when the messages tab is opened
    if (body.event.tab == 'home') {
        await client.views.publish({
            user_id: event.user,
            view: await getAppHome(event.user)
        })
    }
}
