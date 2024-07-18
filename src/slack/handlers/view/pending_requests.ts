import { ActionMiddleware } from '~slack/lib/types'
import { getPendingRequestMessage } from '~slack/blocks/pending_requests'
import config from '~config'

export const handleSendPendingRequests: ActionMiddleware = async ({ ack, client, body }) => {
    await ack()

    const msg = await getPendingRequestMessage({ team_id: body.team!.id, app_id: body.api_app_id })
    await client.chat.postMessage({
        ...msg,
        channel: config.slack.channels.approval
    })
}
