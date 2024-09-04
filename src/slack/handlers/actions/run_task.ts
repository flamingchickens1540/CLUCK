import { OverflowAction } from '@slack/bolt'
import { Blocks, Modal } from 'slack-block-builder'
import { ActionMiddleware } from '~slack/lib/types'
import { runTask } from '~tasks'

export const handleRunTask: ActionMiddleware<OverflowAction> = async ({ ack, body, client, payload }) => {
    await ack()
    const task = payload.selected_option.value
    runTask(task)
        .catch((err) => {
            client.views.open({
                trigger_id: body.trigger_id,
                view: Modal()
                    .title('Task Failed')
                    .blocks(Blocks.Section().text(`Failed to run task '${task}':\n \`\`\`\n${err}\n\`\`\``))
                    .buildToObject()
            })
        })
        .then(() => {
            client.views.open({
                trigger_id: body.trigger_id,
                view: Modal()
                    .title('Task Completed')
                    .blocks(Blocks.Section().text(`Task '${task}' completed successfully`))
                    .buildToObject()
            })
        })
}
