import type { KnownBlock } from '@slack/bolt'
import { formatDuration, sanitizeCodeblock } from '@/slack/lib/messages'

export function getRequestBlocks(uid: string, hrs: number, activity: string, request_id: string): KnownBlock[] {
    return [
        {
            type: 'header',
            text: {
                type: 'plain_text',
                text: 'Time Submission',
                emoji: true
            }
        },
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `>>>*<@${uid}>* submitted *${formatDuration(hrs)}* for activity\n\`${sanitizeCodeblock(activity)}\``
            }
        },
        {
            type: 'actions',
            elements: [
                {
                    type: 'button',
                    text: {
                        type: 'plain_text',
                        emoji: true,
                        text: 'Accept'
                    },
                    style: 'primary',
                    action_id: 'accept',
                    value: request_id
                },
                {
                    type: 'button',
                    text: {
                        type: 'plain_text',
                        emoji: true,
                        text: 'Accept Summer ☀️'
                    },
                    action_id: 'accept_summer',
                    value: request_id
                },
                {
                    type: 'button',
                    text: {
                        type: 'plain_text',
                        emoji: true,
                        text: 'Accept Competition'
                    },
                    action_id: 'accept_comp',
                    value: request_id
                },
                {
                    type: 'button',
                    text: {
                        type: 'plain_text',
                        emoji: true,
                        text: 'Accept w/ Message'
                    },
                    style: 'primary',
                    action_id: 'accept_msg',
                    value: request_id
                },
                {
                    type: 'button',
                    text: {
                        type: 'plain_text',
                        emoji: true,
                        text: 'Reject w/ Message'
                    },
                    style: 'danger',
                    action_id: 'reject',
                    value: request_id
                }
            ]
        },
        {
            type: 'divider'
        }
    ]
}
