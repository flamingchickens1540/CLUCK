import { Blocks, ViewBlockBuilder } from 'slack-block-builder'
import { Prisma } from '@prisma/client'
import { UndefinableArray } from 'slack-block-builder/dist/internal'
import prisma from '~lib/prisma'
import { sortCertLabels } from '~lib/util'

export async function getUserCertBlocks(user: Prisma.MemberWhereUniqueInput): Promise<UndefinableArray<ViewBlockBuilder>> {
    const member = await prisma.member.findUnique({
        where: user,
        select: {
            MemberCerts: {
                select: {
                    Cert: {
                        select: { label: true, isManager: true }
                    }
                }
            }
        }
    })
    if (!member) {
        return [Blocks.Header().text('No member found')]
    }
    const certs: string[] = []
    const managerCerts: string[] = []
    member.MemberCerts.forEach((mc) => {
        if (mc.Cert.isManager) {
            managerCerts.push(mc.Cert.label)
        } else {
            certs.push(mc.Cert.label)
        }
    })
    const output = []
    if (certs.length > 0) {
        output.push(Blocks.Header().text('🎓 Your Certifications'))
        output.push(Blocks.Section().text(certs.sort(sortCertLabels).join('\n')))
    }
    if (managerCerts.length > 0) {
        if (certs.length > 0) {
            output.push(Blocks.Divider())
        }
        output.push(Blocks.Header().text(':office_worker: Your Management Roles'))
        output.push(Blocks.Section().text(managerCerts.join('\n')))
    }
    return output
}
