import type { App } from '@slack/bolt'
import { handleAppHomeOpened } from './views/app_home'
import { handleLogCommand, handleLogShortcut, handleOpenLogModal, handleSubmitLogModal } from './actions/log'
import { handleLogoutCommand } from './actions/logout'
import { handleOpenUserInfoModal } from './views/userinfo'
import { handleVoidCommand } from './actions/void'
import { handleGetLoggedInCommand } from './actions/loggedin'
import config from '~config'
import { handleGraphCommand } from './actions/graph'
import { handleShowHoursCommand, handleShowPendingHours } from './actions/hours'
import { handleCertApprove, handleCertifyCommand, handleCertReject, handleSubmitCertifyModal } from './actions/certify'
import { handleDepartmentsCommand, handleSubmitDepartmentsModal } from './actions/departments'
import { handleOpenOnboardingModal, handleSubmitOnboardingModal } from './views/onboarding'
import {
    createHoursAcceptButtonHandler,
    handleHoursAcceptWithMessageButton,
    handleHoursRejectButton,
    handleSendPendingRequestsButton,
    handleSubmitHoursAcceptModal,
    handleSubmitHoursRejectModal
} from './actions/hours_response'
import { handleRunTask } from '~slack/handlers/actions/run_task'
import { handleAppMentioned } from './actions/checkin'
import { handleOpenEventlogModal, handleSubmitEventlogModal } from './views/eventlog'

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
    CERT_REJECT = 'cert_reject',
    RUN_TASK = 'run_task',
    SETUP_EVENT_LOG = 'setup_event_log'
}

export enum ViewIDs {
    MODAL_REJECT = 'reject_modal',
    MODAL_ACCEPT = 'accept_modal',
    MODAL_LOG = 'time_submission',
    MODAL_CERTIFY = 'certify_modal',
    MODAL_DEPARTMENTS = 'departments_modal',
    MODAL_ONBOARDING = 'onboarding_modal',
    MODAL_EVENTLOG = 'eventlog_modal'
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
    app.action(ActionIDs.ACCEPT, createHoursAcceptButtonHandler('external'))
    app.action(ActionIDs.ACCEPT_SUMMER, createHoursAcceptButtonHandler('summer'))
    app.action(ActionIDs.ACCEPT_EVENT, createHoursAcceptButtonHandler('event'))
    app.action(ActionIDs.ACCEPT_LAB, createHoursAcceptButtonHandler('lab'))
    app.action(ActionIDs.ACCEPT_WITH_MSG, handleHoursAcceptWithMessageButton)
    app.action(ActionIDs.REJECT, handleHoursRejectButton)
    app.action(ActionIDs.OPEN_USERINFO_MODAL, handleOpenUserInfoModal)
    app.action(ActionIDs.OPEN_LOG_MODAL, handleOpenLogModal)
    app.action(ActionIDs.CERT_REJECT, handleCertReject)
    app.action(ActionIDs.CERT_APPROVE, handleCertApprove)
    app.action(ActionIDs.SHOW_OWN_PENDING_REQUESTS, handleShowPendingHours)
    app.action(ActionIDs.SEND_PENDING_REQUESTS, handleSendPendingRequestsButton)
    app.action(ActionIDs.OPEN_ONBOARDING_MODAL, handleOpenOnboardingModal)
    app.action(ActionIDs.RUN_TASK, handleRunTask)
    app.action(ActionIDs.SETUP_EVENT_LOG, handleOpenEventlogModal)
    app.action('jump_url', async ({ ack }) => {
        await ack()
    })

    // Modal Submission
    app.view(ViewIDs.MODAL_REJECT, handleSubmitHoursRejectModal)
    app.view(ViewIDs.MODAL_ACCEPT, handleSubmitHoursAcceptModal)
    app.view(ViewIDs.MODAL_LOG, handleSubmitLogModal)
    app.view(ViewIDs.MODAL_CERTIFY, handleSubmitCertifyModal)
    app.view(ViewIDs.MODAL_DEPARTMENTS, handleSubmitDepartmentsModal)
    app.view(ViewIDs.MODAL_ONBOARDING, handleSubmitOnboardingModal)
    app.view(ViewIDs.MODAL_EVENTLOG, handleSubmitEventlogModal)
    // Events
    app.event('app_home_opened', handleAppHomeOpened)
    app.event('app_mention', handleAppMentioned)
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
        logger.info(details, 'Slack action triggered')
    })

    app.command(/./, async ({ body, logger, command }) => {
        const details: Record<string, string> = {
            type: body?.type,
            user: body?.user?.id,
            command: command?.command,
            text: command?.text
        }
        logger.info(details, 'Slack command triggered')
    })
}
