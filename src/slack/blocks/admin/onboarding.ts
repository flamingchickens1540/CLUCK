import { Blocks, Modal } from 'slack-block-builder'
import { ViewIDs } from '~slack/handlers'
import { slack_client } from '~slack'
import config from '~config'
import prisma from '~lib/prisma'

export async function getOnboardingModal() {
    const dbMembers = await prisma.member.findMany({ where: { slack_id: { not: null } } })
    const dbMemberSet = new Set<string>(dbMembers.map((member) => member.slack_id!))

    const membersPrimary =
        (await slack_client.usergroups.users.list({ usergroup: config.slack.groups.students.primary }).catch((e) => null))?.users?.filter((member) => !dbMemberSet.has(member)) ??
        []
    const membersSecondary =
        (await slack_client.usergroups.users.list({ usergroup: config.slack.groups.students.junior }).catch((e) => null))?.users?.filter((member) => !dbMemberSet.has(member)) ?? []
    const membersCommunity =
        (await slack_client.usergroups.users.list({ usergroup: config.slack.groups.students.community_engineering }).catch((e) => null))?.users?.filter(
            (member) => !dbMemberSet.has(member)
        ) ?? []

    const modal = Modal().title('Onboarding').callbackId(ViewIDs.MODAL_ONBOARDING).submit('Add')
    modal.blocks(
        Blocks.Section().text('The following members will be added to the database'),
        Blocks.Section().text('from <!subteam^' + config.slack.groups.students.primary + '>'),
        Blocks.Divider(),
        Blocks.Section().text(membersPrimary.map((member) => `<@${member}>`).join('\n') || 'None'),
        Blocks.Divider(),
        Blocks.Section().text('from <!subteam^' + config.slack.groups.students.junior + '>'),
        Blocks.Divider(),
        Blocks.Section().text(membersSecondary.map((member) => `<@${member}>`).join('\n') || 'None'),
        Blocks.Divider(),
        Blocks.Section().text('from <!subteam^' + config.slack.groups.students.community_engineering + '>'),
        Blocks.Divider(),
        Blocks.Section().text(membersCommunity.map((member) => `<@${member}>`).join('\n') || 'None')
    )
    return modal.buildToObject()
}
