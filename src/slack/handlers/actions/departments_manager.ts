import { Blocks, Elements, Modal, ModalBuilder, Option } from 'slack-block-builder'
import prisma from '~lib/prisma'
import { ViewIDs } from '~slack/handlers'
import { ActionMiddleware, ViewMiddleware } from '~slack/lib/types'
import { scheduleUpdateSlackProfileDepartments, scheduleUpdateSlackUsergroups } from '~tasks/departments'
import config from '~config'

async function getDepartmentModal(manager_slack_id: string): Promise<ModalBuilder> {
    let managedDepartments: { id: string; name: string }[] = []
    if (config.slack.users.copres.includes(manager_slack_id) || config.slack.users.devs.includes(manager_slack_id)) {
        managedDepartments = await prisma.department.findMany()
    } else {
        const manager = await prisma.member.findUnique({
            where: { slack_id: manager_slack_id, active: true },
            select: {
                MemberCerts: {
                    where: { Cert: { isManager: true } },
                    select: {
                        Cert: {
                            select: {
                                id: true,
                                Department: { select: { name: true, id: true, Certs: { select: { id: true, label: true }, where: { isManager: false } } } }
                            }
                        }
                    }
                }
            }
        })
        if (!manager) {
            return Modal().title(':(').blocks(Blocks.Header().text('No member found'))
        }
        managedDepartments = manager.MemberCerts.map((c) => c.Cert.Department).filter((dept) => dept != null)
    }
    if (managedDepartments.length == 0) {
        return Modal().title(':(').blocks(Blocks.Header().text('Must be a manager'))
    }

    return Modal()
        .title('Manage Departments')
        .blocks(
            Blocks.Input()
                .label('Select the department')
                .blockId('department')
                .element(
                    Elements.StaticSelect()
                        .actionId('department')
                        .options(managedDepartments.map((dept) => Option().text(dept?.name).value(dept?.id)))
                )
        )
        .submit('Open')
}

export const handleManagerDepartmentsCommand: ActionMiddleware = async ({ ack, body, client }) => {
    await ack()
    const modal = await getDepartmentModal(body.user.id)
    await client.views.update({
        view_id: body.view!.id,
        view: modal.callbackId(ViewIDs.MODAL_MGRDEPT_DEPARTMENT).buildToObject()
    })
}

export const handleSubmitManagerDepartmentsModal: ViewMiddleware = async ({ ack, body, client }) => {
    await ack()
    const dept = body.view.state.values.department.department.selected_option!
    const initial_users = await prisma.member.findMany({
        where: {
            active: true,
            Departments: {
                some: {
                    department_id: dept.value
                }
            }
        },
        select: {
            slack_id: true
        }
    })
    const modal = Modal()
        .title('Manage Department')
        .callbackId(ViewIDs.MODAL_MGRDEPT_USERS)
        .privateMetaData(dept.value)
        .blocks(
            Blocks.Header().text(dept.text.text),
            Blocks.Input()
                .blockId('users')
                .element(
                    Elements.UserMultiSelect()
                        .actionId('users')
                        .initialUsers(initial_users.map((user) => user.slack_id!))
                )
                .label('Select Users')
        )
        .submit('Save')
    await client.views.open({
        trigger_id: body.trigger_id,
        view: modal.buildToObject()
    })
}

export const handleSubmitManagerDepartmentUsersModal: ViewMiddleware = async ({ ack, body, client }) => {
    await ack()
    const dept = body.view.private_metadata
    const users = body.view.state.values.users.users.selected_users
    const members = await prisma.member.findMany({ where: { slack_id: { in: users } }, select: { email: true } })
    const member_ids = members.map((member) => member.email)
    console.log(member_ids, dept)
    await prisma.departmentAssociation.deleteMany({ where: { department_id: dept, member_id: { notIn: member_ids } } })
    await prisma.departmentAssociation.createMany({
        data: member_ids.map((id) => ({ member_id: id, department_id: dept })),
        skipDuplicates: true
    })
    scheduleUpdateSlackUsergroups()
    scheduleUpdateSlackProfileDepartments()
}
