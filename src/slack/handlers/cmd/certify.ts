import { AllMiddlewareArgs, SlackCommandMiddlewareArgs, SlackViewMiddlewareArgs, ViewSubmitAction } from '@slack/bolt'
import { getCertifyModal } from '~slack/modals/certify'
import { createCertRequest } from '~lib/cert_operations'
import { ButtonActionMiddlewareArgs } from '~slack/lib/types'
import prisma from '~lib/prisma'
import { safeParseInt } from '~lib/util'

import { getCertRequestMessage } from '~slack/messages/certify'
import { scheduleCertAnnouncement } from '~tasks/certs'

export async function handleCertifyCommand({ command, ack, client }: SlackCommandMiddlewareArgs & AllMiddlewareArgs) {
    await ack()

    await client.views.open({
        view: await getCertifyModal({ slack_id: command.user_id }),
        trigger_id: command.trigger_id
    })
}

export async function handleCertifyModal({ ack, body, view }: SlackViewMiddlewareArgs<ViewSubmitAction> & AllMiddlewareArgs) {
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

export async function handleCertReject({ ack, action, client }: ButtonActionMiddlewareArgs & AllMiddlewareArgs) {
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
            Member: true
        }
    })

    await client.chat.update(getCertRequestMessage({ slack_id: null }, req, req.Cert, 'rejected', req.slack_ts!))
}

export async function handleCertApprove({ ack, action, client }: ButtonActionMiddlewareArgs & AllMiddlewareArgs) {
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
            Member: true
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
    await client.chat.update(getCertRequestMessage({ slack_id: null }, req, req.Cert, 'approved', req.slack_ts!))
    scheduleCertAnnouncement()
}
