import { Blocks, Elements, Modal } from 'slack-block-builder'

//prettier-ignore
export const log_modal = Modal()
    .title('Log External Hours')
    .callbackId('time_submission')
    .submit('Log')
    .close('Cancel')
    .blocks(
        Blocks.Input()
            .blockId('hours')
            .element(Elements.TextInput()
                .actionId('hours')
                .placeholder('2h15m')
            )
            .label('🕘 Hours Spent'),
        Blocks.Input()
            .blockId('task')
            .element(Elements.TextInput()
                .actionId('task')
                .placeholder('Write error messaging for the slack time bot #METAAAAA!!!')
                .multiline())
            .label('🧗 Activity')
    ).buildToObject()

export default log_modal
