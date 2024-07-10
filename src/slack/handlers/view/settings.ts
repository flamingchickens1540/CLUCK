import type { AllMiddlewareArgs, SlackViewMiddlewareArgs, ViewSubmitAction } from '@slack/bolt'
import type { ButtonActionMiddlewareArgs, Department } from '~slack/lib/types'
import { publishDefaultHomeView } from './event/app_home'
import { getSettingsView } from '~slack/modals/settings'
import prisma from '~lib/prisma'

export async function handleOpenSettingsModal({ ack, client, body, logger, respond }: ButtonActionMiddlewareArgs & AllMiddlewareArgs) {
    await ack()
    const member = await prisma.member.findUnique({ where: { slack_id: body.user.id } })
    if (member == null) {
        await respond({ response_type: 'ephemeral', text: 'Who are you' })
        return
    }
    try {
        await client.views.open({
            trigger_id: body.trigger_id,
            view: getSettingsView(member)
        })
    } catch (err) {
        logger.error('Failed to handle open settings modal:\n' + err)
    }
}

export async function handleSettingsClose({ ack, view, body, client }: SlackViewMiddlewareArgs<ViewSubmitAction> & AllMiddlewareArgs) {
    await ack()
    await publishDefaultHomeView(body.user.id, client)
}
