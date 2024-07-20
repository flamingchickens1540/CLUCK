import config from '~config'
import logger from '~lib/logger'
import { WebClient } from '@slack/web-api'

const token = config.slack.app.user_token ?? config.slack.app.bot_token
export const profile_client: WebClient = new WebClient(token)

export async function setProfileAttribute(user: string, field: keyof typeof config.slack.profile, value: string): Promise<boolean> {
    if (!token) {
        return false
    }
    try {
        logger.debug(`Setting slack ${field} for ${user} to '${value}'`)
        const resp = await profile_client!.users.profile.set({
            user: user,
            name: config.slack.profile[field],
            value
        })
        if (!resp.ok) {
            logger.error(resp)
        }
        return resp.ok
    } catch (e) {
        logger.error(e)
        return false
    }
}
