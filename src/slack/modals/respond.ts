import { formatDuration, sanitizeCodeblock } from '~slack/lib/messages'
import { ViewIDs } from '~slack/handlers'
import { Bits, Blocks, Elements, Modal } from 'slack-block-builder'

export function getRespondMessageModal(action: 'Accept' | 'Reject', request: { id: number; duration: number; activity: string; first_name: string }) {
    // prettier-ignore
    const modal = Modal()
        .privateMetaData(request.id.toString())
        .callbackId(action == "Accept" ? ViewIDs.MODAL_ACCEPT : ViewIDs.MODAL_REJECT)
        .title(`${action} Time Request`)
        .submit(`${action} and Send`)
        .close("Cancel")
        .blocks(
            Blocks.Section()
                .text(`_*${request.first_name}*_ submitted *${formatDuration(request.duration)}* for activity\n\n>_\`\`\`${sanitizeCodeblock(request.activity)}\`\`\`_`),
            Blocks.Divider(),
            Blocks.Input()
                .blockId("message")
                .element(Elements.TextInput().actionId("input"))
                .label("Message")
        )
    if (action == 'Accept') {
        modal.blocks(
            Blocks.Input()
                .blockId('type_selector')
                .label('Category')
                .element(
                    Elements.StaticSelect()
                        .actionId('selector')
                        .placeholder('Select a category...')
                        .initialOption(Bits.Option().text('Regular').value('external'))
                        .options(Bits.Option().text('Regular').value('external'), Bits.Option().text('Summer ☀️').value('summer'), Bits.Option().text('Event').value('event'))
                )
        )
    }
    return modal
}
