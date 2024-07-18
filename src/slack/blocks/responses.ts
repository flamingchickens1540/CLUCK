import { Message } from 'slack-block-builder'
import { formatDuration, sanitizeCodeblock } from '~slack/lib/messages'

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
    submissionLoggedDM(v: { hours: number; activity: string }) {
        return Message()
            .text(`:clock2: You submitted *${formatDuration(v.hours)}* :clock7:\n>>>:person_climbing: *Activity:*\n\`\`\`${sanitizeCodeblock(v.activity)}\`\`\``)
            .buildToObject()
    },
    submissionAcceptedDM(v: { slack_id: string; hours: number; activity: string; message?: string }) {
        let msg = `:white_check_mark: *<@${v.slack_id}>* accepted *${formatDuration(v.hours)}* :white_check_mark:\n>>>:person_climbing: *Activity:*\n\`\`\`${sanitizeCodeblock(v.activity)}\`\`\``
        if (v.message) {
            msg += `\n:loudspeaker: *Message:*\n\`\`\`${sanitizeCodeblock(v.message)}\`\`\``
        }
        return Message().text(msg).buildToObject()
    },
    submissionRejectedDM(v: { slack_id: string; hours: number; activity: string; message: string }) {
        return Message()
            .text(
                `:x: *<@${v.slack_id}>* rejected *${formatDuration(v.hours)}* :x:\n>>>:person_climbing: *Activity:*\n\`\`\`${sanitizeCodeblock(v.activity)}\`\`\`\n:loudspeaker: *Message:*\n\`\`\`${sanitizeCodeblock(v.message)}\`\`\``
            )
            .buildToObject()
    }
}
