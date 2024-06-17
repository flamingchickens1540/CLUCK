import { slack_profile_fields, slack_profile_token, slack_token } from '@config'
import logger from '@/lib/logger'
import { LogLevel, Logger as SlackLogger, WebClient } from '@slack/web-api'

const slack_logger: SlackLogger = {
    ...logger,
    setLevel() {},
    setName() {},
    getLevel(): LogLevel {
        return LogLevel.DEBUG
    }
}

const client: WebClient = new WebClient(slack_token, { logger: slack_logger })

const profile_client: WebClient = new WebClient(slack_profile_token, { logger: slack_logger })

export function getClient(): WebClient {
    return client
}

export async function setProfileAttribute(user: string, field: keyof typeof slack_profile_fields, value: string): Promise<boolean> {
    try {
        logger.info(`Setting slack ${field} for ${user} to '${value}'`)
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
