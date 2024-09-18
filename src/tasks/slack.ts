import logger from '~lib/logger'

import AsyncLock from 'async-lock'
import prisma from '~lib/prisma'
import { slack_client } from '~slack'
import { Member as SlackMember } from '@slack/web-api/dist/types/response/UsersListResponse'
import config from '~config'

const lock = new AsyncLock({ maxExecutionTime: 3000, maxPending: 0 })

export async function syncSlackMembers() {
    if (lock.isBusy()) {
        return
    }
    await lock
        .acquire('slack_sync', async () => {
            logger.info('Starting slack sync...')
            const db_members = await prisma.member.findMany()
            const slack_members = (await slack_client.users.list({})).members ?? []
            const slack_members_lookup: Record<string, SlackMember> = {}
            const slack_members_lookup_id: Record<string, SlackMember> = {}
            slack_members.forEach((member) => {
                if (member.profile?.email) {
                    slack_members_lookup[member.profile.email.toLowerCase().trim()] = member
                    slack_members_lookup_id[member.id!] = member
                }
            })
            let updated = 0
            const students_group = await slack_client.usergroups.users.list({ usergroup: config.slack.groups.students })
            const students_set = new Set<string>(students_group.users ?? [])
            for (const member of db_members) {
                const slack_member = (member.slack_id != null ? slack_members_lookup_id[member.slack_id] : null) ?? slack_members_lookup[member.email]
                if (slack_member != null) {
                    const display_name = ((slack_member.profile?.display_name?.length ?? 0) > 0 ? slack_member.profile?.display_name : slack_member.real_name) ?? member.full_name
                    await prisma.member.update({
                        where: { email: member.email },
                        data: {
                            slack_id: slack_member.id,
                            slack_photo: slack_member.profile?.image_original,
                            slack_photo_small: slack_member.profile?.image_192,
                            first_name: display_name.split(' ')[0].trim(),
                            active: students_set.has(slack_member.id!) && !slack_member?.deleted
                        }
                    })
                    updated++
                }
            }
            logger.info(`Found ${updated} members on slack`)
        })
        .catch((err: Error) => logger.warn(err.message))
}
