import * as bolt from '@slack/bolt'
import config from '~config'
import logger, { createBoltLogger } from '~lib/logger'
import { registerSlackHandlers } from '~slack/handlers'
// Initialize Slack App
const slack_app = new bolt.App({
    token: config.slack.app.bot_token,
    signingSecret: config.slack.app.signing_secret,
    socketMode: true,
    appToken: config.slack.app.app_token,
    logger: createBoltLogger()
})

export const slack_client = slack_app.client

export async function startSlack() {
    await slack_app.start()
    registerSlackHandlers(slack_app)
    logger.info('Slack started')
}
