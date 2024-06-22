import { App } from '@slack/bolt'
import { slack_app_token, slack_signing_secret, slack_token } from '@config'

// Initialize Slack App
const slack_app = new App({
    token: slack_token,
    signingSecret: slack_signing_secret,
    socketMode: true,
    appToken: slack_app_token
})

export const slack_client = slack_app.client

slack_app.start().then(async () => {
    console.log('Bot started')
})
