import { Blocks, Message } from 'slack-block-builder'
import { formatDuration, sanitizeCodeblock } from '~slack/lib/messages'
import { getSubmissionContextBlock } from '~slack/blocks/admin/hour_submission'
import { enum_HourLogs_type } from '@prisma/client'

export default {
    tooFewHours() {
        return Message()
            .text(':warning: I just blocked your submission of ZERO hours. Please submit hours in the form: `/log 2h15m write error messaging for the slack time bot #METAAAAA!!!`')
            .buildToObject()
    },
    submissionLogged() {
        return Message().text('Your submission has been logged').buildToObject()
    },
    noActivitySpecified() {
        return Message()
            .text(
                ':warning: I just blocked your submission with no activity. Please submit hours in the form: `/log 2h15m write error messaging for the slack time bot #METAAAAA!!!`'
            )
            .buildToObject()
    },
    submissionLoggedDM(v: { id: number; hours: number; activity: string }) {
        return Message()
            .text(`You submitted ${formatDuration(v.hours)}`)
            .blocks(
                Blocks.Section().text(
                    `:clock2: You submitted *${formatDuration(v.hours)}* :clock7:\n>>>:person_climbing: *Activity:*\n\`\`\`${sanitizeCodeblock(v.activity)}\`\`\``
                ),
                getSubmissionContextBlock({ request_id: v.id.toString(), state: 'pending' })
            )
            .buildToObject()
    },
    submissionRespondedDM(action: 'approve' | 'reject', v: { slack_id: string; hours: number; activity: string; message: string; request_id: number; type?: enum_HourLogs_type }) {
        if (action === 'approve') {
            return this.submissionAcceptedDM(v)
        } else {
            return this.submissionRejectedDM(v)
        }
    },

    submissionAcceptedDM(v: { slack_id: string; hours: number; activity: string; message?: string | null; request_id: number; type?: enum_HourLogs_type }) {
        let msg = `:white_check_mark: *<@${v.slack_id}>* accepted *${formatDuration(v.hours)}* :white_check_mark:\n>>>:person_climbing: *Activity:*\n\`\`\`${sanitizeCodeblock(v.activity)}\`\`\``
        if (v.message) {
            msg += `\n:loudspeaker: *Message:*\n\`\`\`${sanitizeCodeblock(v.message)}\`\`\``
        }
        return Message()
            .text(`<@${v.slack_id}> accepted ${formatDuration(v.hours)}`)
            .blocks(Blocks.Section().text(msg), getSubmissionContextBlock({ request_id: v.request_id.toString(), state: 'approved', type: v.type }))
            .buildToObject()
    },
    submissionRejectedDM(v: { slack_id: string; hours: number; activity: string; message: string; request_id: number }) {
        return Message()
            .text(`<@${v.slack_id}> rejected ${formatDuration(v.hours)}`)
            .blocks(
                Blocks.Section().text(
                    `:x: *<@${v.slack_id}>* rejected *${formatDuration(v.hours)}* :x:\n>>>:person_climbing: *Activity:*\n\`\`\`${sanitizeCodeblock(v.activity)}\`\`\`\n:loudspeaker: *Message:*\n\`\`\`${sanitizeCodeblock(v.message)}\`\`\``
                ),
                getSubmissionContextBlock({ request_id: v.request_id.toString(), state: 'rejected' })
            )
            .buildToObject()
    },

    autoSignoutDM(v: { slack_id: string; time_in: Date }) {
        return Message()
            .text(
                `Hey <@${v.slack_id}>! You signed into the lab today at ${v.time_in.toLocaleTimeString('en-us', { hour: 'numeric', hour12: true, minute: '2-digit' })} but forgot to sign out, so we didn't log your hours for today :( Make sure you always sign out before you leave. Hope you had fun and excited to see you in the lab again!`
            )
            .buildToObject()
    }
}
