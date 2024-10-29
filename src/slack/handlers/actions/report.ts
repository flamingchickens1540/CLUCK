import { getCertifyModal, getCertRequestMessage } from '~slack/blocks/certify'
import { createCertRequest } from '~lib/cert_operations'
import { ActionMiddleware, CommandMiddleware, ViewMiddleware } from '~slack/lib/types'
import prisma from '~lib/prisma'
import { ordinal, safeParseInt } from '~lib/util'
import { Blocks, ConfirmationDialog, Elements, Message, Modal, ModalBuilder } from 'slack-block-builder'
import { ActionIDs, ViewIDs } from '..'
import config from '~config'
import { slack_client } from '~slack'
import logger from '~lib/logger'

async function createReportModal(user_id: string): Promise<ModalBuilder> {
    const manager = await prisma.member.findUnique({
        where: { slack_id: user_id },
        select: { MemberCerts: { where: { Cert: { isManager: true } } } }
    })
    const slack_user = await slack_client.users.info({ user: user_id })
    if (slack_user.user?.is_admin) {
        logger.info('Accepting report from admin: ' + slack_user.user?.name)
    } else if (!manager) {
        return Modal().title('Unauthorized').blocks(Blocks.Header().text("I don't know you 🤨"))
    } else if (manager.MemberCerts.length == 0) {
        return Modal().title('Unauthorized').blocks(Blocks.Header().text("You're not a manager. Please reach out to a manager or Kevin directly if you have concerns"))
    }

    return Modal()
        .title('Report a Violation')
        .callbackId(ViewIDs.MODAL_REPORT)
        .blocks(
            Blocks.Input().label('Member').blockId('user').element(Elements.UserSelect().actionId('user').placeholder('Who are you reporting?')),
            Blocks.Input().label('Description').blockId('description').element(Elements.TextInput().multiline().actionId('description').placeholder('What happened?'))
        )
        .submit('Report')
        .close('Cancel')
}

export const handleReportCommand: CommandMiddleware = async ({ command, ack, client }) => {
    await ack()
    const modal = await createReportModal(command.user_id)
    await client.views.open({
        view: modal.buildToObject(),
        trigger_id: command.trigger_id
    })
}

export const handleSubmitReportModal: ViewMiddleware = async ({ ack, body, view, client }) => {
    // Get the hours and task from the modal
    const slack_id = view.state.values.user.user.selected_user
    const description = view.state.values.description.description.value!
    const member = await prisma.member.findUnique({ where: { slack_id: slack_id ?? '' }, select: { email: true, slack_id: true, Violations: true } })
    if (slack_id == null || member == null) {
        await ack({
            response_action: 'errors',
            errors: { user: 'Unknown user' }
        })
        return
    } else {
        await ack()
        const violation = await prisma.violation.create({
            data: {
                description: description,
                member: member.email,
                reporter_slack_id: body.user.id
            }
        })
        const log_message = Message()
            .text('New Violation Reported')
            .blocks(
                Blocks.Header().text(`Violation Report #${violation.id}`),
                Blocks.Section()
                    .text(`Report by <@${violation.reporter_slack_id}> for <@${member.slack_id}>'s conduct`)
                    .accessory(
                        Elements.Button()
                            .actionId(ActionIDs.DELETE_REPORT)
                            .value(violation.id.toString())
                            .text('🗑️')
                            .confirm(ConfirmationDialog().danger().confirm('Delete').title('Delete Report').text('Are you sure you want to delete this report?').deny('Cancel'))
                            .danger()
                    ),
                Blocks.Context().elements('This is the ' + ordinal(member.Violations.length + 1) + ' violation for this member'),
                Blocks.Section().text('>>> ' + description),
                Blocks.Divider()
            )
            .buildToObject()
        await client.chat.postMessage({ channel: config.slack.channels.violation, text: log_message.text, blocks: log_message.blocks })

        const discuss_message = Message()
            .text('New Violation Reported')
            .blocks(
                Blocks.Header().text(`Violation Report #${violation.id}`),
                Blocks.Context().elements(`For <@${member.slack_id}>`),
                Blocks.Section().text('>>> ' + description),
                Blocks.Divider()
            )
            .buildToObject()
        console.log([...config.slack.users.admins, body.user.id])
        const dm = await client.conversations.open({ users: [...config.slack.users.reports, body.user.id].join(',') })
        await client.chat.postMessage({ channel: dm.channel!.id!, text: discuss_message.text, blocks: discuss_message.blocks })
    }
}

export const handleReportDelete: ActionMiddleware = async ({ ack, respond, action, client, body }) => {
    await ack()
    const report_id = safeParseInt(action.value)
    if (report_id == null) {
        return
    }

    await prisma.violation.delete({
        where: { id: report_id }
    })
    const log_message = Message()
        .text('New Violation Reported')
        .blocks(Blocks.Header().text(`Violation Report #${report_id}`), Blocks.Section().text(`Deleted by <@${body.user.id}> at ${new Date().toLocaleString()}`), Blocks.Divider())
        .buildToObject()

    await respond({ response_type: 'ephemeral', blocks: log_message.blocks! })
}
