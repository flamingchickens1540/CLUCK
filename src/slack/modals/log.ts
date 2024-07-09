import type { ModalView } from '@slack/bolt'

export const log_modal: ModalView = {
    type: 'modal',
    callback_id: 'time_submission',
    title: {
        type: 'plain_text',
        text: 'Log Work Time',
        emoji: true
    },
    submit: {
        type: 'plain_text',
        text: 'Submit',
        emoji: true
    },
    close: {
        type: 'plain_text',
        text: 'Cancel',
        emoji: true
    },
    blocks: [
        {
            type: 'input',
            block_id: 'hours',
            element: {
                type: 'plain_text_input',
                action_id: 'hours'
            },
            label: {
                type: 'plain_text',
                text: ':clock9: Hours Spent',
                emoji: true
            }
        },
        {
            type: 'input',
            block_id: 'task',
            element: {
                type: 'plain_text_input',
                multiline: true,
                action_id: 'task'
            },
            label: {
                type: 'plain_text',
                text: ':person_climbing: Activity',
                emoji: true
            }
        }
    ]
}

export default log_modal
