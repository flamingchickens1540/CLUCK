import { Blocks, Elements, Message } from 'slack-block-builder'
import { formatDuration, sanitizeCodeblock } from '~slack/lib/messages'
import { ActionIDs } from '~slack/handlers'
import { enum_HourLogs_type } from '@prisma/client'
import { toTitleCase } from '~lib/util'

export function getHourSubmissionMessage(v: {
    request_id: string
    slack_id: string
    hours: number
    activity: string
    state: 'pending' | 'approved' | 'rejected'
    type?: enum_HourLogs_type
}) {
    //prettier-ignore
    const msg = Message()
        .text(`<@${v.slack_id}> submitted ${formatDuration(v.hours)} for ${v.activity}`)
        .blocks(
            Blocks.Header().text("Time Submission"),
            Blocks.Section().text(`>>>*<@${v.slack_id}>* submitted *${formatDuration(v.hours)}* for activity\n\`\`\`${sanitizeCodeblock(v.activity)}\`\`\``),
        )
    if (v.state == 'pending') {
        msg.blocks(
            Blocks.Actions().elements(
                Elements.Button().primary().text('Accept').actionId(ActionIDs.ACCEPT).value(v.request_id),
                Elements.Button().text('Accept Summer ☀️').actionId(ActionIDs.ACCEPT_SUMMER).value(v.request_id),
                Elements.Button().text('Accept Event 📆').actionId(ActionIDs.ACCEPT_EVENT).value(v.request_id),
                Elements.Button().text('Accept Lab 🔨').actionId(ActionIDs.ACCEPT_LAB).value(v.request_id),
                Elements.Button().text('Accept w/ Message').actionId(ActionIDs.ACCEPT_WITH_MSG).value(v.request_id)
            ),
            Blocks.Actions().elements(Elements.Button().danger().text('Reject').actionId(ActionIDs.REJECT).value(v.request_id)),
            Blocks.Context().elements(`${v.request_id} | ⏳ Submitted ${new Date().toLocaleString()}`)
        )
    } else if (v.state == 'approved') {
        msg.blocks(Blocks.Context().elements(`${v.request_id} | ✅ Approved as ${toTitleCase(v.type ?? 'external')} ${new Date().toLocaleString()}`))
    } else {
        msg.blocks(Blocks.Context().elements(`${v.request_id} | ❌ Rejected ${new Date().toLocaleString()}`))
    }
    msg.blocks(Blocks.Divider())
    return msg.buildToObject()
}
