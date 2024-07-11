import prisma from '~lib/prisma'
import { slack_client } from '~slack'
import config from '~config'
import { formatDuration } from '~slack/lib/messages'
import { Blocks, Elements, Message } from 'slack-block-builder'

export async function getPendingRequests() {
    const output = Message().channel(config.slack.channels.approval).blocks(Blocks.Header().text('⏳ Pending Time Requests'), Blocks.Divider())
    const pendingRequests = await prisma.hourLog.findMany({
        where: { type: 'external', state: 'pending' },
        select: { id: true, duration: true, message: true, slack_ts: true, Member: { select: { slack_id: true } } }
    })
    for (const log of pendingRequests) {
        const permalink = await slack_client.chat
            .getPermalink({
                channel: config.slack.channels.approval,
                message_ts: log.slack_ts!
            })
            .catch(() => null)
        if (!permalink) {
            console.warn('Could not find slack message for log', log.id)
            continue
        }
        output.blocks(
            Blocks.Section()
                .text(`*<@${log.Member.slack_id}>* - ${formatDuration(log.duration!.toNumber())}`)
                .accessory(Elements.Button().text('Jump').url(permalink.permalink).actionId('jump_url')),
            Blocks.Context().elements(`${log.id} | Submitted ${new Date().toLocaleString()}`),
            Blocks.Divider()
        )
    }

    return output.buildToObject()
}
