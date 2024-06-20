import logger from '@/lib/logger'
import { Member as SlackMember } from '@slack/web-api/dist/types/response/UsersListResponse'
import AsyncLock from 'async-lock'
import { getClient } from '@/lib/slack'
import prisma from '@/lib/db'

const lock = new AsyncLock({ maxExecutionTime: 3000, maxPending: 0 })

export async function syncSlackMembers() {
    if (lock.isBusy()) {
        return
    }
    await lock
        .acquire('slack_sync', async () => {
            logger.info('Starting slack sync...')
            const db_members = await prisma.member.findMany()
            const slack_members = (await getClient().users.list({})).members ?? []

            const slack_members_lookup: Record<string, SlackMember> = {}
            slack_members.forEach((member) => {
                if (member.profile?.email) {
                    slack_members_lookup[member.profile.email.toLowerCase().trim()] = member
                }
            })
            let updated = 0
            for (const member of db_members) {
                const slack_member = slack_members_lookup[member.email]
                if (slack_member != null) {
                    const display_name = ((slack_member.profile?.display_name?.length ?? 0) > 0 ? slack_member.profile?.display_name : slack_member.name) ?? member.full_name
                    await prisma.member.update({
                        where: { email: member.email },
                        data: {
                            slack_id: slack_member.id,
                            slack_photo: slack_member.profile?.image_original,
                            slack_photo_small: slack_member.profile?.image_192,
                            first_name: display_name.split(' ')[0].trim()
                        }
                    })
                    updated++
                }
            }
            logger.info(`Found ${updated} members on slack`)
        })
        .catch((err: Error) => logger.warn(err.message))
}
