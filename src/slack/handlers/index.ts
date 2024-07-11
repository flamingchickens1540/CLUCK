import type { App } from '@slack/bolt'
import { getAcceptButtonHandler, handleAcceptWithMessageButton, handleAcceptModal } from './button/accept'
import { handleAppHomeOpened } from './view/app_home'
import { handleLogCommand, handleLogModal, handleLogShortcut, handleOpenLogModal } from './cmd/log'
import { handleLogoutCommand } from './cmd/logout'
import { handleRejectButton, handleRejectModal } from './button/reject'
import { handleOpenUserInfoModal } from './view/userinfo'
import { handleVoidCommand } from './cmd/void'
import { handleGetLoggedInCommand } from './cmd/loggedin'
import config from '~config'
import { getAllPendingRequestBlocks } from '~slack/lib/messages'

export enum ActionIDs {
    ACCEPT = 'accept',
    ACCEPT_SUMMER = 'accept_summer',
    ACCEPT_EVENT = 'accept_event',
    ACCEPT_WITH_MSG = 'accept_msg',
    REJECT = 'reject',
    OPEN_USERINFO_MODAL = 'open_settings_modal',
    OPEN_LOG_MODAL = 'open_log_modal',
    SEND_PENDING_REQUESTS = 'send_pending_requests'
}

export enum ViewIDs {
    MODAL_REJECT = 'reject_modal',
    MODAL_ACCEPT = 'accept_modal',
    MODAL_LOG = 'time_submission',
    MODAL_SETTINGS = 'save_settings'
}

export function registerSlackHandlers(app: App) {
    // Commands and Shortcuts
    let cmd_prefix = '/'
    if (config.slack.app.command_prefix) {
        cmd_prefix += config.slack.app.command_prefix + '_'
    }
    app.command(cmd_prefix + 'log', handleLogCommand)
    // app.command(cmd_prefix + 'graph', handleGraphCommand)
    app.command(cmd_prefix + 'clearlogin', handleLogoutCommand)
    app.command(cmd_prefix + 'voidtime', handleVoidCommand)
    app.command(cmd_prefix + 'loggedin', handleGetLoggedInCommand)
    app.shortcut('log_hours', handleLogShortcut)
    //
    // // Buttons
    app.action(ActionIDs.ACCEPT, getAcceptButtonHandler('external'))
    app.action(ActionIDs.ACCEPT_SUMMER, getAcceptButtonHandler('summer'))
    app.action(ActionIDs.ACCEPT_EVENT, getAcceptButtonHandler('event'))
    app.action(ActionIDs.ACCEPT_WITH_MSG, handleAcceptWithMessageButton)
    app.action(ActionIDs.REJECT, handleRejectButton)
    app.action(ActionIDs.OPEN_USERINFO_MODAL, handleOpenUserInfoModal)
    app.action(ActionIDs.OPEN_LOG_MODAL, handleOpenLogModal)
    app.action(ActionIDs.SEND_PENDING_REQUESTS, async ({ ack, client }) => {
        await ack()
        const msg = await getAllPendingRequestBlocks()
        await client.chat.postMessage({
            channel: config.slack.channels.approval,
            text: 'Pending requests',
            blocks: msg.blocks
        })
    })
    // app.action('jump_url', async ({ ack }) => {
    //     await ack()
    // })
    //
    // // Inputs
    // app.action('selected_metric', handleLeaderboardAction)
    //
    // // Modals
    app.view('reject_modal', handleRejectModal)
    app.view('accept_modal', handleAcceptModal)
    app.view('time_submission', handleLogModal)
    //
    // // Events
    app.event('app_home_opened', handleAppHomeOpened)
}
