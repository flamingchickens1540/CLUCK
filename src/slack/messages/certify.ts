import { Blocks, Elements, Message } from 'slack-block-builder'
import config from '~config'
import { ActionIDs } from '~slack/handlers'

export function getCertRequestMessage(
    giving_member: { slack_id: null | string },
    r: { id: number; Member: { full_name: string; slack_id: string | null; slack_photo_small: string | null; fallback_photo: string | null } },
    cert: { label: string },
    state: 'pending' | 'approved' | 'rejected',
    ts?: string
) {
    const msg = Message().channel(config.slack.channels.certification_approval).ts(ts)

    let text: string
    let footer: string
    switch (state) {
        case 'approved':
            text = `Approved \`${cert.label}\` cert for <@${r.Member.slack_id}>`
            footer = '✅ Approved'
            break
        case 'rejected':
            text = `Rejected \`${cert.label}\` cert for <@${r.Member.slack_id}>`
            footer = '❌ Rejected'
            break
        default:
            text = `\`${cert.label}\` cert requested for <@${r.Member.slack_id}> by <@${giving_member.slack_id}>`
            footer = '⏳ Submitted'
    }
    msg.text(text)
    msg.blocks(Blocks.Section().text(text))

    if (state == 'pending') {
        msg.blocks(
            Blocks.Actions().elements(
                Elements.Button().primary().text('Approve').actionId(ActionIDs.CERT_APPROVE).value(r.id.toString()),
                Elements.Button().danger().text('Reject').actionId(ActionIDs.CERT_REJECT).value(r.id.toString())
            )
        )
    }
    msg.blocks(
        Blocks.Context().elements(
            Elements.Img()
                .altText(r.Member.full_name)
                .imageUrl(r.Member.slack_photo_small ?? r.Member.fallback_photo ?? ''),
            `${r.id} | ${footer} ${new Date().toLocaleString()}`
        ),
        Blocks.Divider()
    )

    return msg.buildToObject()
}
