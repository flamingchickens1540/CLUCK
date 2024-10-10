import prisma from '~lib/prisma'
import { slack_client } from '~slack'
import config from '~config'
import { formatDuration } from '~slack/lib/messages'
import { Blocks, Elements, Message } from 'slack-block-builder'
import logger from '~lib/logger'
import { HourSubmissionBlocksInput } from '~slack/blocks/admin/hour_submission'

export async function getPendingHourSubmissionData(): Promise<HourSubmissionBlocksInput[]> {
    const pendingRequests = await prisma.hourLog.findMany({
        where: { type: 'external', state: 'pending' },
        select: { id: true, duration: true, message: true, slack_ts: true, createdAt: true, Member: { select: { slack_id: true } } }
    })
    return pendingRequests.map((v) => ({
        request_id: v.id.toString(),
        slack_id: v.Member.slack_id!,
        hours: v.duration!.toNumber(),
        activity: v.message!,
        state: 'pending',
        createdAt: v.createdAt
    }))
}

export async function getPendingRequestMessage({ team_id, app_id }: { team_id: string; app_id: string }) {
    const pendingRequests = await prisma.hourLog.findMany({
        where: { type: 'external', state: 'pending' },
        select: { id: true, duration: true, message: true, slack_ts: true, Member: { select: { slack_id: true } }, createdAt: true }
    })

    const output = Message()
        .channel(config.slack.channels.approval)
        .text(`⏳ ${pendingRequests.length} Pending Time Requests`)
        .blocks(Blocks.Header().text(`⏳ ${pendingRequests.length} Pending Time Requests`), Blocks.Divider())

    for (const log of pendingRequests) {
        const permalink = await slack_client.chat
            .getPermalink({
                channel: config.slack.channels.approval,
                message_ts: log.slack_ts!
            })
            .catch(() => null)
        if (!permalink) {
            logger.warn({ id: log.id }, 'Could not find slack message for log')
            continue
        }
        output.blocks(
            Blocks.Section().text(`*<@${log.Member.slack_id}>* - ${formatDuration(log.duration!.toNumber())}`),
            Blocks.Context().elements(`${log.id} | Submitted ${log.createdAt.toLocaleString()}`),
            Blocks.Divider()
        )
    }
    output.blocks(
        Blocks.Actions().elements(Elements.Button().text('Open App Home').url(`slack://app?team=${team_id}&id=${app_id}&tab=home`).actionId('jump_url')),
        Blocks.Divider()
    )

    return output.buildToObject()
}
