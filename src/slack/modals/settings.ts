import { Member } from '@prisma/client'
import type { KnownBlock, ModalView } from '@slack/bolt'

export const settingsButton: KnownBlock = {
    type: 'actions',
    elements: [
        {
            type: 'button',
            text: {
                type: 'plain_text',
                text: 'Settings',
                emoji: true
            },
            action_id: 'open_settings_modal'
        }
    ]
}

export function getSettingsView(member: Member): ModalView {
    const blocks: KnownBlock[] = []

    return {
        type: 'modal',
        callback_id: 'save_settings',
        title: {
            type: 'plain_text',
            text: 'Settings',
            emoji: true
        },
        submit: {
            type: 'plain_text',
            text: 'Save',
            emoji: true
        },
        close: {
            type: 'plain_text',
            text: 'Cancel',
            emoji: true
        },
        blocks: blocks
    }
}
