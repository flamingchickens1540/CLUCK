import { Blocks, Modal } from 'slack-block-builder'
import { SLACK_USER_REGEX } from '~lib/util'
import { getUserHourSummaryBlocks, getUserPendingRequestBlocks } from '~slack/blocks/member/user_hours'
import { getManagedDepartments } from '~slack/lib/department'
import { ActionMiddleware, CommandMiddleware } from '~slack/lib/types'

export const handleShowHoursCommand: CommandMiddleware = async ({ command, ack, client }) => {
    await ack()
    const managedDepts = await getManagedDepartments({ slack_id: command.user_id })
    let target: string = command.user_id
    if (managedDepts != null && managedDepts.length > 0 && command.text.length > 0) {
        target = command.text.match(SLACK_USER_REGEX)?.[0] ?? target
    }

    await client.views.open({
        view: Modal()
            .title('Hours')
            .blocks(await getUserHourSummaryBlocks({ slack_id: target }), Blocks.Divider(), Blocks.Context().elements('Last updated ' + new Date().toLocaleTimeString()))
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
