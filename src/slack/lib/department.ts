import { Cert, Department } from '~prisma'
import config from '~config'
import prisma from '~lib/prisma'

export async function getManagedDepartments(user: { slack_id: string }): Promise<(Pick<Department, 'name' | 'id'> & { Certs: Pick<Cert, 'id' | 'label'>[] })[] | null> {
    if (config.slack.users.copres.includes(user.slack_id) || config.slack.users.devs.includes(user.slack_id)) {
        return await prisma.department.findMany({
            select: { name: true, id: true, Certs: { select: { id: true, label: true } } }
        })
    } else {
        const manager = await prisma.member.findUnique({
            where: { slack_id: user.slack_id, active: true },
            select: {
                MemberCerts: {
                    where: { Cert: { isManager: true } },
                    select: {
                        Cert: {
                            select: {
                                id: true,
                                Department: { select: { name: true, id: true, Certs: { select: { id: true, label: true }, where: { isManager: false } } } }
                            }
                        }
                    }
                }
            }
        })
        if (!manager) {
            return null
        }
        return manager.MemberCerts.map((c) => c.Cert.Department).filter((dept) => dept != null)
    }
}
