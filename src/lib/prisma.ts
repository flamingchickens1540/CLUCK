import { Member, PrismaClient } from '@prisma/client'
import config from '~config'
import { getMemberPhoto } from '~lib/util'
import logger from '~lib/logger'

export const prisma = new PrismaClient({
    log: [
        {
            emit: 'event',
            level: 'query'
        },
        {
            emit: 'event',
            level: 'info'
        },
        {
            emit: 'event',
            level: 'warn'
        },
        {
            emit: 'event',
            level: 'error'
        }
    ]
})
export default prisma

export function getMemberPhotoOrDefault(member: Pick<Member, 'slack_photo' | 'slack_photo_small' | 'fallback_photo' | 'use_slack_photo'>, small: boolean = false): string {
    return getMemberPhoto(member, small) ?? config.default_photo
}

if (process.env.NODE_ENV != 'prod') {
    prisma.$on('query', (e) => {
        logger.trace({ name: 'prisma' }, e.query)
    })
    prisma.$on('info', (e) => {
        logger.trace({ name: 'prisma' }, e.message)
    })
    prisma.$on('warn', (e) => {
        logger.warn({ name: 'prisma' }, e.message)
    })
    prisma.$on('error', (e) => {
        logger.error({ name: 'prisma' }, e.message)
    })
}
