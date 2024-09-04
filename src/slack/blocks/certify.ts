import { Prisma } from '@prisma/client'
import { Bits, BlockBuilder, Blocks, Elements, Message, Modal, OptionGroupBuilder } from 'slack-block-builder'
import { ActionIDs, ViewIDs } from '~slack/handlers'
import prisma from '~lib/prisma'
import config from '~config'

export async function getCertifyModal(user: Prisma.MemberWhereUniqueInput) {
    const manager = await prisma.member.findUnique({
        where: user,
        select: {
            MemberCerts: {
                where: { Cert: { isManager: true } },
                select: {
                    Cert: {
                        select: {
                            id: true,
                            Department: { select: { name: true, id: true, Certs: { select: { id: true, label: true } } } }
                        }
                    }
                }
            }
        }
    })
    if (!manager) {
        return Modal().title(':(').blocks(Blocks.Header().text('No member found')).buildToObject()
    }
    const managedDepartments = manager.MemberCerts.map((c) => c.Cert.Department)
    if (managedDepartments.length == 0) {
        return Modal().title(':(').blocks(Blocks.Header().text('Must be a manager')).buildToObject()
    }

    const optionGroups: OptionGroupBuilder[] = managedDepartments
        .filter((d) => d != null)
        .map((d) => {
            return Bits.OptionGroup()
                .label(d.name)
                .options(d.Certs.map((c) => Bits.Option().text(c.label).value(c.id)))
        })

    return Modal()
        .title('Certify')
        .callbackId(ViewIDs.MODAL_CERTIFY)
        .blocks(
            Blocks.Input().label('Member(s)').blockId('users').element(Elements.UserMultiSelect().actionId('users').placeholder('Select the members to certify')),
            Blocks.Input()
                .label('Certification')
                .blockId('cert')
                .element(Elements.StaticSelect().actionId('cert').placeholder('Select the certification to give').optionGroups(optionGroups))
        )
        .submit('Submit')
        .close('Cancel')
        .buildToObject()
}

export function getCertRequestBlocks(r: {
    id: number
    state: 'pending' | 'approved' | 'rejected'
    Requester: { slack_id: string | null }
    Member: { full_name: string; slack_id: string | null; slack_photo_small: string | null; fallback_photo: string | null }
    Cert: { label: string }
}): { blocks: BlockBuilder[]; text: string } {
    let text: string
    let footer: string
    const blocks: BlockBuilder[] = []
    switch (r.state) {
        case 'approved':
            text = `Approved \`${r.Cert.label}\` cert for <@${r.Member.slack_id}>`
            footer = '✅ Approved'
            break
        case 'rejected':
            text = `Rejected \`${r.Cert.label}\` cert for <@${r.Member.slack_id}>`
            footer = '❌ Rejected'
            break
        default:
            text = `\`${r.Cert.label}\` cert requested for <@${r.Member.slack_id}> by <@${r.Requester.slack_id}>`
            footer = '⏳ Submitted'
    }
    blocks.push(Blocks.Section().text(text))

    if (r.state == 'pending') {
        blocks.push(
            Blocks.Actions().elements(
                Elements.Button().primary().text('Approve').actionId(ActionIDs.CERT_APPROVE).value(r.id.toString()),
                Elements.Button().danger().text('Reject').actionId(ActionIDs.CERT_REJECT).value(r.id.toString())
            )
        )
    }
    blocks.push(
        Blocks.Context().elements(
            Elements.Img()
                .altText(r.Member.full_name)
                .imageUrl(r.Member.slack_photo_small ?? r.Member.fallback_photo ?? ''),
            `${r.id} | ${footer} ${new Date().toLocaleString()}`
        )
    )
    return { blocks, text }
}

export function getCertRequestMessage(r: {
    id: number
    state: 'pending' | 'approved' | 'rejected'
    slack_ts: string | null
    Requester: { slack_id: string | null }
    Member: { full_name: string; slack_id: string | null; slack_photo_small: string | null; fallback_photo: string | null }
    Cert: { label: string }
}) {
    const msg = Message().channel(config.slack.channels.certification_approval).ts(r.slack_ts!)

    const { blocks, text } = getCertRequestBlocks(r)
    msg.text(text).blocks(blocks)
    return msg.buildToObject()
}
