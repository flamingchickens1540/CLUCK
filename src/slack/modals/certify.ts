import { Prisma } from '@prisma/client'
import { Bits, Blocks, Elements, Modal, OptionGroupBuilder } from 'slack-block-builder'
import { ViewIDs } from '~slack/handlers'
import prisma from '~lib/prisma'

export async function getCertifyModal(user: Prisma.MemberWhereUniqueInput) {
    const userCerts = await prisma.member.findUnique({
        where: user,
        select: {
            MemberCerts: {
                where: { Cert: { isManager: true } },
                select: {
                    Cert: {
                        select: { id: true }
                    }
                }
            }
        }
    })
    if (!userCerts) {
        return Modal().title(':(').blocks(Blocks.Header().text('No member found')).buildToObject()
    }
    const managedCerts = await prisma.cert.findMany({
        where: { managerCert: { in: userCerts.MemberCerts.map((mc) => mc.Cert.id) } },
        orderBy: { label: 'asc' }
    })
    if (managedCerts.length == 0) {
        return Modal().title(':(').blocks(Blocks.Header().text('Must be a manager')).buildToObject()
    }
    let lastDept = ''
    const optionGroups: OptionGroupBuilder[] = []
    managedCerts.forEach((c) => {
        if (c.id.split('_')[0] != lastDept) {
            lastDept = c.id.split('_')[0]
            optionGroups.push(Bits.OptionGroup().label(lastDept))
        }
        optionGroups[optionGroups.length - 1].options(Bits.Option().text(c.label).value(c.id))
    })

    return Modal()
        .title('Certify')
        .callbackId(ViewIDs.MODAL_CERTIFY)
        .blocks(
            Blocks.Input().label('Member(s)').blockId('users').element(Elements.UserMultiSelect().actionId('users').placeholder('Select the members to certify')),
            Blocks.Input()
                .label('Certification')
                .blockId('cert')
                .element(Elements.StaticSelect().actionId('cert').placeholder('Select the certification to certify').optionGroups(optionGroups))
        )
        .submit('Submit')
        .close('Cancel')
        .buildToObject()
}
