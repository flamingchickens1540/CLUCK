import { BlockBuilder, Blocks, Elements, Message } from 'slack-block-builder'
import { formatDuration, sanitizeCodeblock } from '~slack/lib/messages'
import { ActionIDs } from '~slack/handlers'
import { enum_HourLogs_type } from '@prisma/client'
import { toTitleCase } from '~lib/util'

export const getSubmissionContextBlock = ({
    request_id,
    state,
    type,
    createdAt
}: {
    request_id: string
    state: 'pending' | 'approved' | 'rejected'
    type?: enum_HourLogs_type
    createdAt?: Date
}) => {
    createdAt ??= new Date()
    switch (state) {
        case 'pending':
            return Blocks.Context().elements(`${request_id} | ⏳ Submitted ${createdAt.toLocaleString()}`)
        case 'approved':
            return Blocks.Context().elements(`${request_id} | ✅ Approved ${new Date().toLocaleString()} | ${toTitleCase(type ?? 'external')}`)
        case 'rejected':
            return Blocks.Context().elements(`${request_id} | ❌ Rejected ${new Date().toLocaleString()}`)
    }
}

export type HourSubmissionBlocksInput = {
    request_id: string
    slack_id: string
    hours: number
    activity: string
    response?: string | null
    state: 'pending' | 'approved' | 'rejected'
    type?: enum_HourLogs_type
    createdAt: Date
}
export function getHourSubmissionBlocks(v: HourSubmissionBlocksInput) {
    const blocks: BlockBuilder[] = []
    blocks.push(
        Blocks.Header().text('Time Submission'),
        Blocks.Section().text(`>>>*<@${v.slack_id}>* submitted *${formatDuration(v.hours)}* for activity\n\`\`\`${sanitizeCodeblock(v.activity)}\`\`\``)
    )
    if (v.response) {
        blocks.push(Blocks.Section().text(`>>>*Response:*\n\`\`\`${sanitizeCodeblock(v.response)}\`\`\``))
    }
    if (v.state == 'pending') {
        blocks.push(
            Blocks.Actions().elements(
                Elements.Button().primary().text('Accept').actionId(ActionIDs.ACCEPT).value(v.request_id),
                Elements.Button().danger().text('Reject').actionId(ActionIDs.REJECT).value(v.request_id),
                // Elements.Button().text('☀️').actionId(ActionIDs.ACCEPT_SUMMER).value(v.request_id), // 7 buttons renders poorly, not used in fall
                Elements.Button().text('📆').actionId(ActionIDs.ACCEPT_EVENT).value(v.request_id),
                Elements.Button().text('🔨').actionId(ActionIDs.ACCEPT_LAB).value(v.request_id),
                Elements.Button().text('⛳').actionId(ActionIDs.ACCEPT_OUTREACH).value(v.request_id),
                Elements.Button().text('Accept w/ Message').actionId(ActionIDs.ACCEPT_WITH_MSG).value(v.request_id)
            )
        )
    }
    blocks.push(getSubmissionContextBlock(v))

    return blocks
}

export function getHourSubmissionMessage(v: HourSubmissionBlocksInput) {
    //prettier-ignore
    const msg = Message()
        .text(`<@${v.slack_id}> submitted ${formatDuration(v.hours)} for ${v.activity}`)
        .blocks(
            getHourSubmissionBlocks(v),
            Blocks.Divider()
        )
    return msg.buildToObject()
}
