import logger from '~lib/logger'

import AsyncLock from 'async-lock'
import prisma from '~lib/prisma'
import { slack_client } from '~slack'
import { Member as SlackMember } from '@slack/web-api/dist/types/response/UsersListResponse'
import config from '~config'
import { setProfileAttribute } from '~slack/lib/profile'
import { getTeamName } from '~lib/util'
import { enum_Member_Team } from '@prisma/client'

const lock = new AsyncLock({ maxExecutionTime: 3000, maxPending: 0 })

export async function updateProfileTeam() {
    const members = await prisma.member.findMany({
        where: { slack_id: { not: null } },
        select: {
            slack_id: true,
            team: true
        }
    })
    for (const member of members) {
        if (member.slack_id) {
            await setProfileAttribute(member.slack_id, 'team', getTeamName(member.team) ?? '')
        }
    }
}
type Team = enum_Member_Team
const teams: [Team, string] = [
    ['primary', config.slack.groups.students.primary],
    ['junior', config.slack.groups.students.junior],
    ['community', config.slack.groups.students.community_engineering],
    ['unaffiliated', config.slack.groups.mentors],
    ['unaffiliated', config.slack.groups.other]
]
export async function syncSlackMembers() {
    if (lock.isBusy()) {
        return
    }
    await lock
        .acquire('slack_sync', async () => {
            logger.info('Starting slack sync...')
            const db_members = await prisma.member.findMany()
            const slack_members = (await slack_client.users.list({})).members ?? []
            const slack_members_lookup_email: Record<string, SlackMember> = {}
            const slack_members_lookup_id: Record<string, SlackMember> = {}
            slack_members.forEach((member) => {
                if (member.profile?.email) {
                    slack_members_lookup_email[member.profile.email.toLowerCase().trim()] = member
                    slack_members_lookup_id[member.id!] = member
                }
            })
            let updated = 0
            const active = new Map<string, Team>()
            for (const [team, usergroup] of teams) {
                const members = await slack_client.usergroups.users.list({ usergroup: usergroup }).catch(() => null)
                if (members?.users == null || !members.ok) {
                    logger.error({ members }, 'Could not fetch group members for ' + team)
                    continue
                }
                for (const member of members.users) {
                    if (active.has(member)) {
                        if (team != 'unaffiliated') {
                            logger.warn({ member, new: team, existing: active.get(member) }, 'Member affiliated with two teams')
                        }
                    } else {
                        active.set(member, team as Team)
                    }
                }
            }
            for (const member of db_members) {
                const slack_member = (member.slack_id != null ? slack_members_lookup_id[member.slack_id] : null) ?? slack_members_lookup_email[member.email]
                if (slack_member != null) {
                    const display_name = ((slack_member.profile?.display_name?.length ?? 0) > 0 ? slack_member.profile?.display_name : slack_member.real_name) ?? member.full_name
                    const team = active.get(slack_member.id!)
                    await prisma.member.update({
                        where: { email: member.email },
                        data: {
                            slack_id: slack_member.id,
                            slack_photo: slack_member.profile?.image_original,
                            slack_photo_small: slack_member.profile?.image_192,
                            first_name: display_name.split(' ')[0].trim(),
                            full_name: slack_member.profile!.real_name!,
                            team: team,
                            active: team != null && !slack_member?.deleted
                        }
                    })
                    updated++
                }
            }
            logger.info(`Found ${updated} members on slack`)
        })
}
