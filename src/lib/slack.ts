import { slack_profile_fields, slack_token } from '@config'
import logger from '@/lib/logger'
import { LogLevel, WebClient } from '@slack/web-api'

const client: WebClient = new WebClient(slack_token, {
    logger: {
        ...logger,
        setLevel() {},
        setName() {},
        getLevel(): LogLevel {
            return LogLevel.DEBUG
        }
    }
})

export function getClient(): WebClient {
    return client
}

export async function setProfileAttribute(user: string, field: keyof typeof slack_profile_fields, value: string): Promise<boolean> {
    try {
        const resp = await client.users.profile.set({
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
