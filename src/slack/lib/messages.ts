import type { KnownBlock, WebClient } from '@slack/web-api'

/**
 * Push notification message for when a time request is submitted
 */
export const getSubmittedAltText = (name: string, hours: number, activity: string) => {
    return `${name} submitted ${formatDuration(hours)} for ${activity}`
}

export const tooFewHours = ':warning: I just blocked your submission of ZERO hours. Please submit hours in the form: `/log 2h 15m write error messaging for the slack time bot #METAAAAA!!!` :warning: (Make note of spaces/lack of spaces)'
export const submissionLogged = 'Your submission has been logged'
export const noActivitySpecified = ':warning: I just blocked your submission with no activity. Please submit hours in the form: `/log 2h 15m write error messaging for the slack time bot #METAAAAA!!!` :warning: (Make note of spaces/lack of spaces)'

// /**
//  * Gets a list of pending time requests
//  */
// export const getAllPendingRequestBlocks = async (slack_client: WebClient) => {
//
//     const output: KnownBlock[] = [
//         {
//             "type": "header",
//             "text": {
//                 "type": "plain_text",
//                 "text": ":clock1: Pending Time Requests:",
//                 "emoji": true
//             }
//         },
//     ]
//     await Promise.all(Object.values(data.timeRequests).map(async (person) => {
//         data.slackApproverIDs.forEach(async (approver_id) => {
//             if (person.requestMessages[approver_id] == null) {
//                 return
//             }
//             const permalink = await slack_client.chat.getPermalink({ channel: person.requestMessages[approver_id].channel, message_ts: person.requestMessages[approver_id].ts })
//             output.push({
//                 "type": "section",
//                 "text": {
//                     "type": "mrkdwn",
//                     "text": `*${person.name}* - ${formatDuration(person.time)}\n\`${sanitizeCodeblock(person.activity)}\``,
//                 },
//                 "accessory": {
//                     "type": "button",
//                     "text": {
//                         "type": "plain_text",
//                         "text": "Jump"
//                     },
//                     "url": permalink.permalink,
//                     "action_id": "jump_url"
//                 }
//             }, { "type": "divider" })
//         })
//     }));
//     return output
// }

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
