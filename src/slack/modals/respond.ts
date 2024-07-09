import type { ModalView } from '@slack/bolt'
import { formatDuration, sanitizeCodeblock } from '~slack/lib/messages'

export function getRespondMessageModal(type: 'Accept' | 'Reject', request: { id: number; duration: number; activity: string; first_name: string }): ModalView {
    const callback_id = `${type.toLowerCase()}_modal`
    const data: ModalView = {
        type: 'modal',
        private_metadata: request.id.toString(),
        callback_id: callback_id,
        title: {
            type: 'plain_text',
            text: type + 'Time Request',
            emoji: true
        },
        submit: {
            type: 'plain_text',
            text: type + ' and Send',
            emoji: true
        },
        close: {
            type: 'plain_text',
            text: 'Cancel',
            emoji: true
        },
        blocks: [
            {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `_*${request.first_name}*_ submitted *${formatDuration(request.duration)}* for activity\n\n>_\`\`\`${sanitizeCodeblock(request.activity)}\`\`\`_`
                }
            },
            {
                type: 'divider'
            },
            {
                type: 'input',
                block_id: 'message',
                element: {
                    type: 'plain_text_input',
                    multiline: true,
                    action_id: 'input'
                },
                label: {
                    type: 'plain_text',
                    text: type + ' and Send Message',
                    emoji: true
                }
            }
        ]
    }
    if (type == 'Accept') {
        data.blocks.push({
            block_id: 'type_selector',
            type: 'input',
            label: {
                type: 'plain_text',
                text: 'Type of submission',
                emoji: true
            },
            element: {
                action_id: 'selector',
                type: 'static_select',
                initial_option: {
                    text: {
                        type: 'plain_text',
                        text: 'Regular',
                        emoji: true
                    },
                    value: 'external'
                },
                placeholder: {
                    type: 'plain_text',
                    emoji: true,
                    text: 'Select a type'
                },
                // options: Object.values(metrics),
                options: [
                    {
                        text: {
                            type: 'plain_text',
                            text: 'Regular',
                            emoji: true
                        },
                        value: 'external'
                    },
                    {
                        text: {
                            type: 'plain_text',
                            text: 'Summer ☀️',
                            emoji: true
                        },
                        value: 'summer'
                    },
                    {
                        text: {
                            type: 'plain_text',
                            text: 'Competition',
                            emoji: true
                        },
                        value: 'competition'
                    }
                ]
            }
        })
    }
    return data
}
