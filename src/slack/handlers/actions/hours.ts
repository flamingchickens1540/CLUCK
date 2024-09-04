import { Blocks, Modal } from 'slack-block-builder'
import { getUserHourSummaryBlocks, getUserPendingRequestBlocks } from '~slack/blocks/member/user_hours'
import { ActionMiddleware, CommandMiddleware } from '~slack/lib/types'

export const handleShowHoursCommand: CommandMiddleware = async ({ command, ack, client }) => {
    await ack()

    await client.views.open({
        view: Modal()
            .title('Hours')
            .blocks(await getUserHourSummaryBlocks({ slack_id: command.user_id }), Blocks.Divider(), Blocks.Context().elements('Last updated ' + new Date().toLocaleTimeString()))
            .buildToObject(),
        trigger_id: command.trigger_id
    })
}

export const handleShowPendingHours: ActionMiddleware = async ({ body, ack, client }) => {
    await ack()
    const modal = Modal()
        .title('Hours')
        .blocks(await getUserPendingRequestBlocks({ slack_id: body.user.id }))
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
