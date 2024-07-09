import bolt from '@slack/bolt'
import config from '~config'
import { registerSlackHandlers } from '~slack/handlers'
// Initialize Slack App
const slack_app = new bolt.App({
    token: config.slack.app.bot_token,
    signingSecret: config.slack.app.signing_secret,
    socketMode: true,
    appToken: config.slack.app.app_token
})

export const slack_client = slack_app.client

slack_app.start().then(async () => {
    registerSlackHandlers(slack_app)
})
