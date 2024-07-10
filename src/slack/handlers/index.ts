import type { App } from '@slack/bolt'
import { getAcceptButtonHandler, handleAcceptMessageButton, handleAcceptModal } from './button/accept'
import { handleAppHomeOpened } from './view/app_home'
import { handleLogCommand, handleLogModal, handleLogShortcut } from './cmd/log'
import { handleLogoutCommand } from './cmd/logout'
import { handleRejectButton, handleRejectModal } from './button/reject'
import { handleOpenSettingsModal, handleSettingsClose } from './view/settings'
import { handleVoidCommand } from './cmd/void'
import { handleGetLoggedInCommand } from './cmd/loggedin'
import config from '~config'

export enum ActionIDs {
    ACCEPT = 'accept',
    ACCEPT_SUMMER = 'accept_summer',
    ACCEPT_EVENT = 'accept_event',
    ACCEPT_WITH_MSG = 'accept_msg',
    REJECT = 'reject',
    OPEN_SETTINGS_MODAL = 'open_settings_modal'
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
    app.action(ActionIDs.ACCEPT_WITH_MSG, handleAcceptMessageButton)
    app.action(ActionIDs.REJECT, handleRejectButton)
    app.action(ActionIDs.OPEN_SETTINGS_MODAL, handleOpenSettingsModal)
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
    app.view('save_settings', handleSettingsClose)
    //
    // // Events
    app.event('app_home_opened', handleAppHomeOpened)
}
