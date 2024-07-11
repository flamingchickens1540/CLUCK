import { AllMiddlewareArgs, SlackCommandMiddlewareArgs } from '@slack/bolt'
import { Modal } from 'slack-block-builder'
import { getUserHoursBlocks } from '~slack/modals/user_hours'

export async function handleShowHoursCommand({ command, ack, client }: SlackCommandMiddlewareArgs & AllMiddlewareArgs) {
    await ack()

    await client.views.open({
        view: Modal()
            .title('Hours')
            .blocks(await getUserHoursBlocks({ slack_id: command.user_id }))
            .buildToObject(),
        trigger_id: command.trigger_id
    })
}
