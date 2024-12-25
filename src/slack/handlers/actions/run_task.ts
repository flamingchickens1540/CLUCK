import { OverflowAction } from '@slack/bolt'
import { Blocks, Modal } from 'slack-block-builder'
import logger from '~lib/logger'
import { ActionMiddleware } from '~slack/lib/types'
import { runTask } from '~tasks'

export const handleRunTask: ActionMiddleware<OverflowAction> = async ({ ack, body, client, payload }) => {
    await ack()
    const task = payload.selected_option.value
    await runTask(task)
        .catch(async (err) => {
            await client.views.open({
                trigger_id: body.trigger_id,
                view: Modal()
                    .title('Task Failed')
                    .blocks(Blocks.Section().text(`Failed to run task '${task}':\n \`\`\`\n${err}\n\`\`\``))
                    .buildToObject()
            })
        })
        .then(async () => {
            await client.views.open({
                trigger_id: body.trigger_id,
                view: Modal()
                    .title('Task Completed')
                    .blocks(Blocks.Section().text(`Task '${task}' completed successfully`))
                    .buildToObject()
            })
        })
        .catch(async (err) => {
            logger.error(err, 'Could not send feedback')
        })
}
