import { Prisma } from '@prisma/client'
import prisma from '~lib/prisma'
import { slack_client } from '~slack'
import { getCertRequestMessage } from '~slack/blocks/certify'

enum CertOperationsError {
    CERT_NOT_FOUND = 'This cert cannot be found',
    CERT_NOT_MANAGED = "This cert can't be given by managers",
    USER_NOT_MANAGER = 'You are not a manager for this cert',
    USER_NOT_FOUND = 'User not found'
}

export async function canGiveCert(user: Prisma.MemberWhereUniqueInput, cert: { department: string | null }) {
    if (cert.department == null) {
        return { success: false, error: CertOperationsError.CERT_NOT_MANAGED }
    }
    const managecert = await prisma.memberCert.findFirst({
        where: {
            Member: user,
            Cert: { department: cert.department, isManager: true }
        }
    })

    if (managecert == null) {
        return { success: false, error: CertOperationsError.USER_NOT_MANAGER }
    }
    return { success: true }
}

export async function createCertRequest(giver: Prisma.MemberWhereUniqueInput, recipient_slack_ids: string[], cert_id: Prisma.CertWhereUniqueInput) {
    const cert = await prisma.cert.findUnique({
        where: cert_id,
        select: { id: true, department: true, replaces: true, label: true }
    })
    if (!cert) {
        return { success: false, error: CertOperationsError.CERT_NOT_FOUND }
    }
    const canGive = await canGiveCert(giver, cert)
    if (!canGive.success) {
        return canGive
    }

    const giving_member = await prisma.member.findUnique({ where: giver })
    if (!giving_member) {
        return { success: false, error: CertOperationsError.USER_NOT_FOUND }
    }
    const recipients = await prisma.member.findMany({
        select: { email: true, MemberCerts: { where: { cert_id: cert.id }, select: { cert_id: true } } },
        where: { slack_id: { in: recipient_slack_ids } }
    })
    if (recipients.length != recipient_slack_ids.length) {
        return { success: false, error: CertOperationsError.USER_NOT_FOUND }
    }
    setTimeout(async () => {
        // Do in separate event loop to avoid blocking the request
        const resp = await prisma.memberCertRequest.createManyAndReturn({
            data: recipients
                .filter((r) => r.MemberCerts.length == 0) // Only request certs for members who don't already have it
                .map((member) => ({
                    requester_id: giving_member.email,
                    member_id: member.email,
                    cert_id: cert.id,
                    state: 'pending'
                })),
            select: {
                id: true,
                slack_ts: true,
                Cert: true,
                Member: true,
                Requester: true,
                state: true
            }
        })
        for (const r of resp) {
            const msg = await slack_client.chat.postMessage(getCertRequestMessage(r))
            await prisma.memberCertRequest.update({ where: { id: r.id }, data: { slack_ts: msg.ts } })
        }
    })
    return { success: true }
}

export async function getManagers() {
    const departments = await prisma.department.findMany({
        include: {
            Certs: {
                where: {
                    isManager: true
                },
                select: {
                    Instances: {
                        select: {
                            Member: {
                                select: {
                                    email: true,
                                    slack_id: true
                                }
                            }
                        }
                    }
                }
            }
        }
    })

    return departments.map((dept) => ({
        dept,
        managers: dept.Certs.flatMap((cert) => cert.Instances.map((instance) => instance.Member.slack_id).filter((v) => v != null))
    }))
}
