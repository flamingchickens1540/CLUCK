import type { ActionMiddleware } from '~slack/lib/types'
import { getUserDataModal } from '~slack/modals/user_info'

export const handleOpenUserInfoModal: ActionMiddleware = async ({ ack, client, body, logger }) => {
    await ack()
    try {
        await client.views.open({
            trigger_id: body.trigger_id,
            view: (await getUserDataModal({ slack_id: body.user.id })).buildToObject()
        })
    } catch (err) {
        logger.error('Failed to handle open settings modal:\n' + err)
    }
}
