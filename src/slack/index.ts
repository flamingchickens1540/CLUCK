import { App } from '@slack/bolt'
import config from '@config'

// Initialize Slack App
const slack_app = new App({
    token: config.slack.app.bot_token,
    signingSecret: config.slack.app.signing_secret,
    socketMode: true,
    appToken: config.slack.app.app_token
})

export const slack_client = slack_app.client

slack_app.start().then(async () => {
    console.log('Bot started')
})
