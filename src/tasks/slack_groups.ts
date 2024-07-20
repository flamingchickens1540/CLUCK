import prisma from '~lib/prisma'
import { slack_client } from '~slack'

let timeout: NodeJS.Timeout

export function scheduleUpdateSlackUsergroups() {
    if (timeout) {
        timeout.refresh()
    } else {
        timeout = setTimeout(updateSlackUsergroups, 1000 * 60)
    }
}

async function updateSlackUsergroups() {
    const departments = await prisma.department.findMany({ include: { Members: { select: { Member: { select: { slack_id: true } } } } } })
    for (const department of departments) {
        const members = department.Members.filter((m) => m.Member.slack_id != null).map((m) => m.Member.slack_id!)
        if (members.length > 0 && department.slack_group != null) {
            await slack_client.usergroups.users.update({
                usergroup: department.slack_group,
                users: members.join(',')
            })
        }
    }
}
