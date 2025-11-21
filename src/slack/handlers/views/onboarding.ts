import { enum_Member_Team } from '~prisma'
import config from '~config'
import prisma from '~lib/prisma'
import { slack_client } from '~slack'
import { getOnboardingModal } from '~slack/blocks/admin/onboarding'
import type { ActionMiddleware, ViewMiddleware } from '~slack/lib/types'

export const handleOpenOnboardingModal: ActionMiddleware = async ({ body, ack, client }) => {
    await ack()

    await client.views.open({
        view: await getOnboardingModal(),
        trigger_id: body.trigger_id
    })
}

export const handleSubmitOnboardingModal: ViewMiddleware = async ({ ack }) => {
    await ack()
    const dbMembers = await prisma.member.findMany({ where: { slack_id: { not: null } } })
    const dbMemberSet = new Set<string>(dbMembers.map((member) => member.slack_id!))

    const teams = new Map<string, enum_Member_Team>()
    ;(await slack_client.usergroups.users.list({ usergroup: config.slack.groups.students.primary }).catch(() => null))?.users
        ?.filter((member) => !dbMemberSet.has(member))
        .forEach((m) => teams.set(m, 'primary'))
    ;(await slack_client.usergroups.users.list({ usergroup: config.slack.groups.students.junior }).catch(() => null))?.users
        ?.filter((member) => !dbMemberSet.has(member))
        .forEach((m) => teams.set(m, 'junior'))
    ;(await slack_client.usergroups.users.list({ usergroup: config.slack.groups.students.community_engineering }).catch(() => null))?.users
        ?.filter((member) => !dbMemberSet.has(member))
        .forEach((m) => teams.set(m, 'community'))

    const user_list = await slack_client.users.list({})
    const fallback_photos = await prisma.fallbackPhoto.findMany()
    const fallback_photo_map = new Map<string, string>(fallback_photos.map((fp) => [fp.email, fp.url]))
    await prisma.member.createMany({
        data:
            user_list.members
                ?.filter((m) => teams.has(m.id!))
                .map((m) => ({
                    email: m.profile!.email!.trim().toLowerCase(),
                    slack_id: m.id,
                    slack_photo: m.profile?.image_original,
                    slack_photo_small: m.profile?.image_192,
                    first_name: m.profile!.real_name_normalized!.split(' ')[0] ?? m.profile!.real_name_normalized,
                    full_name: m.profile!.real_name_normalized!,
                    fallback_photo: fallback_photo_map.get(m.profile!.email!),
                    use_slack_photo: false,
                    active: true,
                    team: teams.get(m.id!)
                })) ?? []
    })
}
