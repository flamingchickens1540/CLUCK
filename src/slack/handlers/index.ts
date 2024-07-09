import type { App } from '@slack/bolt'
import { getAcceptButtonHandler, handleAcceptMessageButton, handleAcceptModal } from './button/accept'
import { handleLeaderboardAction, handleAppHomeOpened } from './app_home'
import { handleGraphCommand } from './graph'
import { handleLogCommand, handleLogModal, handleLogShortcut } from './cmd/log'
import { handleLogoutCommand } from './cmd/logout'
import { handleRejectButton, handleRejectModal } from './button/reject'
import { handleOpenSettingsModal, handleSettingsSave } from './settings'
import { handleVoidCommand } from './cmd/void'
import { handleGetLoggedInCommand } from './cmd/loggedin'
import config from '~config'

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
    // app.shortcut('log_hours', handleLogShortcut)
    //
    // // Buttons
    app.action('accept', getAcceptButtonHandler('external'))
    app.action('accept_summer', getAcceptButtonHandler('summer'))
    app.action('accept_comp', getAcceptButtonHandler('event'))
    app.action('accept_msg', handleAcceptMessageButton)
    app.action('reject', handleRejectButton)
    // app.action('open_settings_modal', handleOpenSettingsModal)
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
    // app.view('time_submission', handleLogModal)
    // app.view('save_settings', handleSettingsSave)
    //
    // // Events
    // app.event('app_home_opened', handleAppHomeOpened)
}
