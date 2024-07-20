import prisma from '~lib/prisma'
import logger from '~lib/logger'
import { profile_client } from '~slack/lib/profile'

let timeout: NodeJS.Timeout

export function scheduleUpdateSlackUsergroups() {
    if (timeout) {
        timeout.refresh()
    } else {
        timeout = setTimeout(updateSlackUsergroups, 1000 * 30)
    }
}

async function updateSlackUsergroups() {
    if (profile_client == null) {
        return
    }
    const departments = await prisma.department.findMany({ include: { Members: { select: { Member: { select: { slack_id: true } } } } } })
    for (const department of departments) {
        if (department.slack_group == null) {
            const resp = await profile_client.usergroups.create({
                name: department.name,
                handle: department.name.toLowerCase().replace(' ', '-')
            })
            if (resp.error) {
                logger.error({ error: resp.error, department: department.id }, 'Could not create usergroup')
            } else {
                await prisma.department.update({
                    where: { id: department.id },
                    data: {
                        slack_group: resp.usergroup!.id
                    }
                })
                department.slack_group = resp.usergroup!.id!
            }
        }
        const members = department.Members.filter((m) => m.Member.slack_id != null).map((m) => m.Member.slack_id!)
        if (members.length > 0 && department.slack_group != null) {
            await profile_client.usergroups.users.update({
                usergroup: department.slack_group,
                users: members.join(',')
            })
        }
    }
}
