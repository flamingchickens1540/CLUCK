import type { ActionMiddleware, ViewMiddleware } from '~slack/lib/types'
import { getLogModal } from '~slack/blocks/member/log'
import { safeParseFloat } from '~lib/util'
import { handleHoursRequest } from '~slack/lib/submission'
import { parseArgs } from '~slack/handlers/cmd/log'

export const handleOpenLogModal: ActionMiddleware = async ({ body, ack, client }) => {
    await ack()

    await client.views.open({
        view: getLogModal(),
        trigger_id: body.trigger_id
    })
}

export const handleSubmitLogModal: ViewMiddleware = async ({ ack, body, view }) => {
    // Get the hours and task from the modal
    let hours = safeParseFloat(view.state.values.hours.hours.value) ?? parseArgs(view.state.values.hours.hours.value ?? '').hours
    const activity = view.state.values.task.task.value

    // Ensure the time values are valid
    hours = isNaN(hours) ? 0 : hours
    if (hours < 0.1) {
        await ack({ response_action: 'errors', errors: { hours: 'Please enter a valid duration' } })
        return
    }
    if (activity?.trim() == '' || activity == undefined) {
        await ack({ response_action: 'errors', errors: { task: 'Please enter an activity' } })
        return
    }

    await ack()
    await handleHoursRequest(body.user.id, hours, activity)
}
