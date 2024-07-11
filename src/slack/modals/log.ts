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
            .element(Elements.TextInput().actionId('hours'))
            .label('🕘 Hours Spent'),
        Blocks.Input()
            .blockId('task')
            .element(Elements.TextInput().actionId('task').multiline())
            .label('🧗 Activity')
    )

export default log_modal
