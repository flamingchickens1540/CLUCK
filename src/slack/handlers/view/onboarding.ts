import type { ActionMiddleware, ViewMiddleware } from '~slack/lib/types'
import { getOnboardingModal } from '~slack/blocks/admin/onboarding'
import { slack_client } from '~slack'
import prisma from '~lib/prisma'

export const handleOpenOnboardingModal: ActionMiddleware = async ({ body, ack, client }) => {
    await ack()

    await client.views.open({
        view: await getOnboardingModal(),
        trigger_id: body.trigger_id
    })
}

export const handleSubmitOnboardingModal: ViewMiddleware = async ({ ack, body, view }) => {
    await ack()
    const members = new Set(view.private_metadata.split(','))
    const user_list = await slack_client.users.list({})
    const members_to_add = user_list.members?.filter((m) => members.has(m.id!)) ?? []
    await prisma.member.createMany({
        data: members_to_add.map((m) => ({
            email: m.profile!.email!,
            slack_id: m.id,
            slack_photo: m.profile?.image_original,
            slack_photo_small: m.profile?.image_192,
            first_name: m.profile!.real_name_normalized!.split(' ')[0] ?? m.profile!.real_name_normalized,
            full_name: m.profile!.real_name_normalized!,
            grade: 0,
            years: 1,
            team: 'junior',
            use_slack_photo: false,
            active: true
        }))
    })
}
