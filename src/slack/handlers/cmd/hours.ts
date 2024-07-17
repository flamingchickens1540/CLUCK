import { AllMiddlewareArgs, SlackCommandMiddlewareArgs } from '@slack/bolt'
import { Blocks, Modal } from 'slack-block-builder'
import { getUserHoursBlocks, getUserPendingHoursBlocks } from '~slack/modals/user_hours'
import { ButtonActionMiddlewareArgs } from '~slack/lib/types'

export async function handleShowHoursCommand({ command, ack, client }: SlackCommandMiddlewareArgs & AllMiddlewareArgs) {
    await ack()

    await client.views.open({
        view: Modal()
            .title('Hours')
            .blocks(await getUserHoursBlocks({ slack_id: command.user_id }), Blocks.Divider(), Blocks.Context().elements('Last updated ' + new Date().toLocaleTimeString()))
            .buildToObject(),
        trigger_id: command.trigger_id
    })
}

export async function handleShowPendingHours({ body, ack, client }: ButtonActionMiddlewareArgs & AllMiddlewareArgs) {
    await ack()
    const modal = Modal()
        .title('Hours')
        .blocks(await getUserPendingHoursBlocks({ slack_id: body.user.id }))
        .buildToObject()
    if (body.view?.type == 'modal') {
        await client.views.update({
            view: modal,
            view_id: body.view.id
        })
    } else {
        await client.views.open({
            view: modal,
            trigger_id: body.trigger_id
        })
    }
}
