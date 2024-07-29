import prisma from '~lib/prisma'
import logger from '~lib/logger'
import { profile_client } from '~slack/lib/profile'
import { slack_client } from '~slack'

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
    const usergroups_list = await slack_client.usergroups.list({ include_disabled: true })
    const usergroups = new Map(usergroups_list.usergroups!.map((g) => [g.id!, g]))
    const departments = await prisma.department.findMany({ include: { Members: { select: { Member: { select: { slack_id: true } } } } } })
    for (const department of departments) {
        const handle = department.name.toLowerCase().replace(' ', '-') + '-dept'
        const existing = usergroups.get(department.slack_group ?? '')
        if (department.slack_group == null || existing == null) {
            const resp = await profile_client.usergroups
                .create({
                    name: department.name,
                    handle
                })
                .catch((e) => {
                    return { usergroup: null, error: e }
                })
            if (resp.error != null) {
                logger.error({ error: resp.error, department: department.id, handle: department.name.toLowerCase().replace(' ', '-') }, 'Could not create usergroup')
                continue
            } else {
                await prisma.department.update({
                    where: { id: department.id },
                    data: {
                        slack_group: resp.usergroup!.id
                    }
                })
                department.slack_group = resp.usergroup!.id!
            }
        } else {
            if (existing.name != department.name || existing.handle != handle) {
                await profile_client.usergroups.update({
                    usergroup: department.slack_group,
                    name: department.name,
                    handle
                })
            }
        }

        const members = department.Members.filter((m) => m.Member.slack_id != null).map((m) => m.Member.slack_id!)
        if (members.length == 0 && existing != null) {
            // If it's already disabled, don't disable it again
            if (!existing.date_delete) {
                await profile_client.usergroups.disable({
                    usergroup: department.slack_group
                })
            }
        }
        if (members.length > 0) {
            if (existing?.date_delete) {
                await profile_client.usergroups.enable({
                    usergroup: department.slack_group
                })
            }
            await profile_client.usergroups.users.update({
                usergroup: department.slack_group,
                users: members.join(',')
            })
        }
    }
}
