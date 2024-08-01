import type { App } from '@slack/bolt'
import { getAcceptButtonHandler, handleAcceptWithMessageButton, handleSubmitAcceptModal } from './button/accept'
import { handleAppHomeOpened } from './view/app_home'
import { handleLogCommand, handleLogShortcut } from './cmd/log'
import { handleLogoutCommand } from './cmd/logout'
import { handleRejectButton, handleSubmitRejectModal } from './button/reject'
import { handleOpenUserInfoModal } from './view/userinfo'
import { handleVoidCommand } from './cmd/void'
import { handleGetLoggedInCommand } from './cmd/loggedin'
import config from '~config'
import { handleGraphCommand } from '~slack/handlers/cmd/graph'
import { handleShowHoursCommand, handleShowPendingHours } from '~slack/handlers/cmd/hours'
import { handleCertApprove, handleCertifyCommand, handleCertReject, handleSubmitCertifyModal } from '~slack/handlers/cmd/certify'
import { handleOpenLogModal, handleSubmitLogModal } from '~slack/handlers/view/log_modal'
import { handleSendPendingRequests } from '~slack/handlers/button/pending_requests'
import { handleDepartmentsCommand, handleSubmitDepartmentsModal } from '~slack/handlers/cmd/departments'
import { handleOpenOnboardingModal, handleSubmitOnboardingModal } from '~slack/handlers/view/onboarding'

export enum ActionIDs {
    ACCEPT = 'accept',
    ACCEPT_SUMMER = 'accept_summer',
    ACCEPT_EVENT = 'accept_event',
    ACCEPT_LAB = 'accept_lab',
    ACCEPT_WITH_MSG = 'accept_msg',
    REJECT = 'reject',
    OPEN_USERINFO_MODAL = 'open_settings_modal',
    OPEN_LOG_MODAL = 'open_log_modal',
    SHOW_OWN_PENDING_REQUESTS = 'show_own_pending_requests',
    OPEN_ONBOARDING_MODAL = 'open_onboarding_modal',
    SEND_PENDING_REQUESTS = 'send_pending_requests',
    CERT_APPROVE = 'cert_approve',
    CERT_REJECT = 'cert_reject'
}

export enum ViewIDs {
    MODAL_REJECT = 'reject_modal',
    MODAL_ACCEPT = 'accept_modal',
    MODAL_LOG = 'time_submission',
    MODAL_CERTIFY = 'certify_modal',
    MODAL_DEPARTMENTS = 'departments_modal',
    MODAL_ONBOARDING = 'onboarding_modal'
}

export function registerSlackHandlers(app: App) {
    // Commands and Shortcuts
    let cmd_prefix = '/'
    if (config.slack.app.command_prefix) {
        cmd_prefix += config.slack.app.command_prefix + '_'
    }
    app.command(cmd_prefix + 'log', handleLogCommand)
    app.command(cmd_prefix + 'graph', handleGraphCommand)
    app.command(cmd_prefix + 'clearlogin', handleLogoutCommand)
    app.command(cmd_prefix + 'voidtime', handleVoidCommand)
    app.command(cmd_prefix + 'loggedin', handleGetLoggedInCommand)
    app.command(cmd_prefix + 'hours', handleShowHoursCommand)
    app.command(cmd_prefix + 'certify', handleCertifyCommand)
    app.command(cmd_prefix + 'departments', handleDepartmentsCommand)
    app.shortcut('log_hours', handleLogShortcut)

    // Buttons
    app.action(ActionIDs.ACCEPT, getAcceptButtonHandler('external'))
    app.action(ActionIDs.ACCEPT_SUMMER, getAcceptButtonHandler('summer'))
    app.action(ActionIDs.ACCEPT_EVENT, getAcceptButtonHandler('event'))
    app.action(ActionIDs.ACCEPT_LAB, getAcceptButtonHandler('lab'))
    app.action(ActionIDs.ACCEPT_WITH_MSG, handleAcceptWithMessageButton)
    app.action(ActionIDs.REJECT, handleRejectButton)
    app.action(ActionIDs.OPEN_USERINFO_MODAL, handleOpenUserInfoModal)
    app.action(ActionIDs.OPEN_LOG_MODAL, handleOpenLogModal)
    app.action(ActionIDs.CERT_REJECT, handleCertReject)
    app.action(ActionIDs.CERT_APPROVE, handleCertApprove)
    app.action(ActionIDs.SHOW_OWN_PENDING_REQUESTS, handleShowPendingHours)
    app.action(ActionIDs.SEND_PENDING_REQUESTS, handleSendPendingRequests)
    app.action(ActionIDs.OPEN_ONBOARDING_MODAL, handleOpenOnboardingModal)
    app.action('jump_url', async ({ ack }) => {
        await ack()
    })

    // Modal Submission
    app.view(ViewIDs.MODAL_REJECT, handleSubmitRejectModal)
    app.view(ViewIDs.MODAL_ACCEPT, handleSubmitAcceptModal)
    app.view(ViewIDs.MODAL_LOG, handleSubmitLogModal)
    app.view(ViewIDs.MODAL_CERTIFY, handleSubmitCertifyModal)
    app.view(ViewIDs.MODAL_DEPARTMENTS, handleSubmitDepartmentsModal)
    app.view(ViewIDs.MODAL_ONBOARDING, handleSubmitOnboardingModal)
    // Events
    app.event('app_home_opened', handleAppHomeOpened)
    app.action(/./, async ({ body, logger, action }) => {
        const details: Record<string, string> = {
            type: body?.type,
            user: body?.user?.id
        }
        if ('value' in action) {
            details.value = action.value
        }
        if ('action_id' in action) {
            details.action_id = action.action_id
        }
        logger.debug(details, 'Slack action triggered')
    })

    app.command(/./, async ({ body, logger, command }) => {
        const details: Record<string, string> = {
            type: body?.type,
            user: body?.user?.id,
            command: command?.command,
            text: command?.text
        }
        logger.debug(details, 'Slack command triggered')
    })
}
