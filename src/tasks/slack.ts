import logger from '~lib/logger'

import AsyncLock from 'async-lock'
import prisma from '~lib/prisma'
import { slack_client } from '~slack'
import { Member as SlackMember } from '@slack/web-api/dist/response/UsersListResponse'

const lock = new AsyncLock({ maxExecutionTime: 3000, maxPending: 0 })

export async function syncSlackMember(email: string) {
    const db_member = await prisma.member.findUnique({
        where: { email }
    })
    if (db_member == null) {
        logger.warn(`Failed to find ${email} in database`)
        return
    }
    const lookup = await slack_client.users.lookupByEmail({ email })
    if (!lookup.ok) {
        logger.warn(`Failed to find ${email} on slack`)
        return
    }
    const slack_member = lookup.user
    if (slack_member != null) {
        const display_name = ((slack_member.profile?.display_name?.length ?? 0) > 0 ? slack_member.profile?.display_name : slack_member.name) ?? db_member.full_name
        await prisma.member.update({
            where: { email },
            data: {
                slack_id: slack_member.id,
                slack_photo: slack_member.profile?.image_original,
                slack_photo_small: slack_member.profile?.image_192,
                first_name: display_name.split(' ')[0].trim()
            }
        })
    }
    logger.info(`Linked ${db_member.email} on slack`)
}

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
