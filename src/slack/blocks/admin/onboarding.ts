import { Blocks, Modal } from 'slack-block-builder'
import { ViewIDs } from '~slack/handlers'
import { slack_client } from '~slack'
import config from '~config'
import prisma from '~lib/prisma'

export async function getOnboardingModal() {
    const dbMembers = await prisma.member.findMany({ where: { slack_id: { not: null } } })
    const dbMemberSet = new Set<string>(dbMembers.map((member) => member.slack_id!))

    const slackMembers = (await slack_client.usergroups.users.list({ usergroup: config.slack.groups.students })).users!
    const newMembers = slackMembers.filter((member) => !dbMemberSet.has(member))

    const modal = Modal().title('Onboarding').callbackId(ViewIDs.MODAL_ONBOARDING).submit('Add')
    modal.blocks(
        Blocks.Section().text('The following members will be added to the database from <!subteam^' + config.slack.groups.students + '>'),
        Blocks.Divider(),
        Blocks.Section().text(newMembers.map((member) => `<@${member}>`).join('\n') || 'None')
    )
    modal.privateMetaData(newMembers.join(','))

    return modal.buildToObject()
}
