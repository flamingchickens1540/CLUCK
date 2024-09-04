import { getCertifyModal, getCertRequestMessage } from '~slack/blocks/certify'
import { createCertRequest } from '~lib/cert_operations'
import { ActionMiddleware, CommandMiddleware, ViewMiddleware } from '~slack/lib/types'
import prisma from '~lib/prisma'
import { safeParseInt } from '~lib/util'
import { scheduleCertAnnouncement } from '~tasks/certs'
import { slack_client } from '~slack'
import { getAppHome } from '~slack/blocks/app_home'

export const handleCertifyCommand: CommandMiddleware = async ({ command, ack, client }) => {
    await ack()

    await client.views.open({
        view: await getCertifyModal({ slack_id: command.user_id }),
        trigger_id: command.trigger_id
    })
}

export const handleSubmitCertifyModal: ViewMiddleware = async ({ ack, body, view }) => {
    // Get the hours and task from the modal
    const members = view.state.values.users.users.selected_users
    const cert = view.state.values.cert.cert.selected_option?.value
    if (members == null || members.length == 0 || cert == null) {
        await ack({
            response_action: 'errors',
            errors: { users: 'Please select a user', cert: 'Please select a certification' }
        })
        return
    } else {
        const { success, error } = await createCertRequest({ slack_id: body.user.id }, members, { id: cert })
        if (!success) {
            await ack({ response_action: 'errors', errors: { users: error ?? 'Unknown error' } })
        } else {
            await ack()
        }
    }
}

export const handleCertReject: ActionMiddleware = async ({ ack, action, client, body }) => {
    await ack()
    const cert_req_id = safeParseInt(action.value)
    if (cert_req_id == null) {
        return
    }

    const req = await prisma.memberCertRequest.update({
        where: { id: cert_req_id },
        data: { state: 'rejected' },
        select: {
            id: true,
            slack_ts: true,
            Cert: true,
            Member: true,
            Requester: true,
            state: true
        }
    })

    await client.chat.update(getCertRequestMessage(req))
    await slack_client.views.publish({
        user_id: body.user.id,
        view: await getAppHome(body.user.id)
    })
}

export const handleCertApprove: ActionMiddleware = async ({ ack, action, client, body }) => {
    await ack()
    const cert_req_id = safeParseInt(action.value)
    if (cert_req_id == null) {
        return
    }

    const req = await prisma.memberCertRequest.update({
        where: { id: cert_req_id },
        data: { state: 'approved' },
        select: {
            id: true,
            slack_ts: true,
            Cert: true,
            Member: true,
            Requester: true,
            state: true
        }
    })
    if (!req) {
        return
    }
    await prisma.memberCert.create({
        data: {
            cert_id: req.Cert.id,
            member_id: req.Member.email,
            announced: false
        }
    })
    if (req.Cert.replaces) {
        try {
            await prisma.memberCert.delete({
                where: {
                    cert_id_member_id: {
                        cert_id: req.Cert.replaces,
                        member_id: req.Member.email
                    }
                }
            })
        } catch {
            // If the cert doesn't exist, that's fine
        }
    }
    await client.chat.update(getCertRequestMessage(req))
    scheduleCertAnnouncement()
    await slack_client.views.publish({
        user_id: body.user.id,
        view: await getAppHome(body.user.id)
    })
}
