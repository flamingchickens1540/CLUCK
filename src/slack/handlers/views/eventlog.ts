import type { ActionMiddleware, ViewMiddleware } from '~slack/lib/types'
import { slack_client } from '~slack'
import { Blocks, Elements, Message, Modal } from 'slack-block-builder'
import { ActionIDs, ViewIDs } from '..'
import { parseArgs } from '../actions/log'

export const handleOpenEventlogModal: ActionMiddleware = async ({ body, ack, client }) => {
    await ack()

    const modal = Modal()
        .title('Setup Event Hour Logger')
        .callbackId(ViewIDs.MODAL_EVENTLOG)
        .submit('Create')
        .close('Cancel')
        .blocks(
            Blocks.Input().blockId('event').element(Elements.TextInput().actionId('name').placeholder('Chezy Champs')).label('📆 Event Name'),
            Blocks.Input().blockId('time').element(Elements.TextInput().actionId('time').placeholder('2h')).hint('In 2h15m format').label('🕘 Default Time'),
            Blocks.Input().blockId('channel').element(Elements.ChannelSelect().actionId('channel')).label('Channel in which to send the message')
        )
    await client.views.open({
        view: modal.buildToObject(),
        trigger_id: body.trigger_id
    })
}

export const handleSubmitEventlogModal: ViewMiddleware = async ({ ack, view }) => {
    const event_name = view.state.values.event.name.value
    if (!event_name) {
        await ack({ response_action: 'errors', errors: { event: 'Missing event name' } })
        return
    }

    const time = view.state.values.time.time.value
    const parsedtime = parseArgs(time ?? '').hours
    if (!time || parsedtime == 0) {
        await ack({ response_action: 'errors', errors: { time: 'Invalid duration' } })
        return
    }

    const prettytime = Math.round(parsedtime * 10) / 10
    const channel_id = view.state.values.channel.channel.selected_channel!
    const resp = await slack_client.chat.postMessage(
        Message()
            .channel(channel_id)
            .text('Log ' + prettytime + ' hours for ' + event_name)
            .blocks(
                Blocks.Section().text('Log `' + prettytime + '` hours for `' + event_name + '`'),
                Blocks.Actions().elements(
                    Elements.Button()
                        .text('Log...')
                        .primary()
                        .actionId(ActionIDs.OPEN_LOG_MODAL)
                        .value(JSON.stringify({ task: event_name, time: prettytime + 'h' }))
                )
            )
            .buildToObject()
    )

    if (resp.ok) {
        await ack()
    } else {
        await ack({ response_action: 'errors', errors: {} })
    }
}
