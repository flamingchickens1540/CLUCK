import { Modal } from 'slack-block-builder'
import { CommandMiddleware, ViewMiddleware } from '~slack/lib/types'
import { getDepartmentPicker } from '~slack/blocks/member/user_departments'
import { ViewIDs } from '~slack/handlers'
import prisma from '~lib/prisma'
import logger from '~lib/logger'
import { setProfileAttribute } from '~slack/lib/profile'
import { formatList } from '~slack/lib/messages'
import { scheduleUpdateSlackUsergroups } from '~tasks/slack_groups'

export const handleDepartmentsCommand: CommandMiddleware = async ({ ack, body, client }) => {
    await ack()
    await client.views.open({
        trigger_id: body.trigger_id,
        view: Modal()
            .title('Departments')
            .submit('Save')
            .callbackId(ViewIDs.MODAL_DEPARTMENTS)
            .privateMetaData(body.channel_id)
            .blocks(await getDepartmentPicker({ slack_id: body.user_id }))
            .buildToObject()
    })
}

export const handleDepartmentsModalSubmit: ViewMiddleware = async ({ ack, body, client }) => {
    // Save the user's departments
    await ack()
    const options = body.view.state.values.department.department.selected_options!
    const department_ids = options.map((o) => o.value)
    const member = await prisma.member.findUnique({ where: { slack_id: body.user.id } })
    if (!member) {
        logger.warn(`User ${body.user.id} not found in database`)
        return
    }
    await prisma.departmentAssociation.deleteMany({ where: { member_id: member.email, department_id: { notIn: department_ids } } })
    await prisma.departmentAssociation.createMany({
        data: department_ids.map((id) => ({ member_id: member.email, department_id: id })),
        skipDuplicates: true
    })
    const depts = await prisma.department.findMany({ where: { id: { in: department_ids } }, select: { slack_group: true, name: true } })
    await setProfileAttribute(body.user.id, 'department', formatList(depts.map((d) => d.name)) || 'None')

    await client.chat
        .postEphemeral({
            user: body.user.id,
            channel: body.view.private_metadata,
            text: 'Successfully updated your departments: ' + formatList(depts.map((d) => d.name)) || 'None'
        })
        .catch(() => {})
    scheduleUpdateSlackUsergroups()
}
