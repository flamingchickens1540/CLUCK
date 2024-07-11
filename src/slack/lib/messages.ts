import { KnownBlock } from '@slack/bolt'
import prisma from '~lib/prisma'
import { slack_client } from '~slack'
import config from '~config'
import { Blocks, Elements, Message } from 'slack-block-builder'

export const slackResponses = {
    tooFewHours() {
        return ':warning: I just blocked your submission of ZERO hours. Please submit hours in the form: `/log 2h15m write error messaging for the slack time bot #METAAAAA!!!`'
    },
    submissionLogged() {
        return 'Your submission has been logged'
    },
    noActivitySpecified() {
        return ':warning: I just blocked your submission with no activity. Please submit hours in the form: `/log 2h15m write error messaging for the slack time bot #METAAAAA!!!`'
    },
    submissionLoggedDM(v: { hours: number; activity: string }) {
        return `:clock2: You submitted *${formatDuration(v.hours)}* :clock7:\n>>>:person_climbing: *Activity:*\n\`${sanitizeCodeblock(v.activity)}\``
    },
    submissionAcceptedDM(v: { slack_id: string; hours: number; activity: string; message?: string }) {
        let msg = `:white_check_mark: *<@${v.slack_id}>* accepted *${formatDuration(v.hours)}* :white_check_mark:\n>>>:person_climbing: *Activity:*\n\`${sanitizeCodeblock(v.activity)}\``
        if (v.message) {
            msg += `\n:loudspeaker: *Message:*\n\`${sanitizeCodeblock(v.message)}\``
        }
        return msg
    },
    submissionRejectedDM(v: { slack_id: string; hours: number; activity: string; message: string }) {
        return `:x: *<@${v.slack_id}>* rejected *${formatDuration(v.hours)}* :x:\n>>>:person_climbing: *Activity:*\n\`${sanitizeCodeblock(v.activity)}\`\n:loudspeaker: *Message:*\n\`${sanitizeCodeblock(v.message)}\``
    }
}

/**
 * Gets a list of pending time requests
 */
export async function getAllPendingRequestBlocks() {
    // prettier-ignore
    const output = Message().blocks(
        Blocks.Header().text('⏳ Pending Time Requests'),
        Blocks.Divider()
    )
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

export function sanitizeCodeblock(activity: string): string {
    return activity.replace('`', "'")
}

export function formatDuration(hrs: number, mins?: number): string {
    if (typeof mins === 'undefined') {
        const mins_cached = hrs * 60
        hrs = Math.floor(Math.abs(mins_cached) / 60) * Math.sign(mins_cached)
        mins = Math.round(mins_cached % 60)
    }
    const hours = hrs === 1 ? '1 hour' : `${hrs} hours`
    const minutes = mins === 1 ? '1 minute' : `${mins} minutes`

    if (hrs === 0) {
        return minutes
    } else if (mins === 0) {
        return hours
    } else {
        return `${hours} and ${minutes}`
    }
}

export function formatNames(names: string[]): string {
    if (names[0] == 'all') {
        names[0] = 'Team 1540'
    }
    if (names.length === 1) {
        return names[0]
    } else if (names.length === 2) {
        return `${names[0]} and ${names[1]}`
    } else {
        return `${names.slice(0, names.length - 1).join(', ')}, and ${names[names.length - 1]}`
    }
}
