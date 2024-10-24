import { Blocks, Elements, Modal } from 'slack-block-builder'
import { ViewIDs } from '~slack/handlers'

//prettier-ignore
export const getLogModal =(defaults?:{time:string, task:string}) => Modal()
    .title('Log External Hours')
    .callbackId(ViewIDs.MODAL_LOG)
    .submit('Log')
    .close('Cancel')
    .blocks(
        Blocks.Input()
            .blockId('time')
            .element(Elements.TextInput()
                .actionId('time')
                .placeholder('2h15m')
                .initialValue(defaults?.time ?? "")
            )
            .label('🕘 Time Spent'),
        Blocks.Input()
            .blockId('task')
            .element(Elements.TextInput()
                .actionId('task')
                .placeholder('Write error messaging for the slack time bot #METAAAAA!!!')
                .initialValue(defaults?.task ?? "")
                .multiline())
            .label('🧗 Activity')
    ).buildToObject()
