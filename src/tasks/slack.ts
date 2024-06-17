import logger from '@/lib/logger'
import { Member } from '@/lib/db/members'
import { Member as SlackMember } from '@slack/web-api/dist/types/response/UsersListResponse'
import AsyncLock from 'async-lock'
import { getClient } from '@/lib/slack'

const lock = new AsyncLock({ maxExecutionTime: 3000, maxPending: 0 })

export async function syncSlackMembers() {
    if (lock.isBusy()) {
        return
    }
    await lock
        .acquire('slack_sync', async () => {
            logger.info('Starting slack sync...')
            const db_members = await Member.findAll()
            const slack_members = (await getClient().users.list({})).members ?? []

            const slack_members_lookup: Record<string, SlackMember> = {}
            slack_members.forEach((member) => (slack_members_lookup[member.profile!.email!] = member))
            let updated = 0
            for (const member of db_members) {
                const slack_member = slack_members_lookup[member.email]
                if (slack_member != null) {
                    member.slack_id = slack_member.id
                    member.slack_photo = slack_member.profile?.image_original
                    member.slack_photo_small = slack_member.profile?.image_192

                    const display_name = ((slack_member.profile?.display_name?.length ?? 0) > 0 ? slack_member.profile?.display_name : slack_member.name) ?? member.full_name
                    member.first_name = display_name.split(' ')[0].trim()

                    await member.save()
                    updated++
                } // #4cc091
            }
            logger.info(`Found ${updated} members on slack`)
        })
        .catch((err) => logger.warn(err))
}
