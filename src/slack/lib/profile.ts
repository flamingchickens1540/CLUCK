import { slack_profile_fields, slack_user_token } from '@config'
import logger from '@/lib/logger'
import { WebClient } from '@slack/web-api'

const profile_client: WebClient = new WebClient(slack_user_token)

export async function setProfileAttribute(user: string, field: keyof typeof slack_profile_fields, value: string): Promise<boolean> {
    try {
        logger.debug(`Setting slack ${field} for ${user} to '${value}'`)
        const resp = await profile_client.users.profile.set({
            user: user,
            name: slack_profile_fields[field],
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
