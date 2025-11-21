import { Member, PrismaClient } from '~prisma'
import config from '~config'
import { getMemberPhoto } from '~lib/util'
import logger from '~lib/logger'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({})

export const prisma = new PrismaClient({
    adapter,
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
}).$extends({
    result: {
        member: {
            isManager: {
                needs: { email: true },
                compute(user) {
                    return async () => {
                        return await prisma.memberCert.count({
                            where: { member_id: user.email, Cert: { isManager: true } }
                        })
                    }
                }
            }
        }
    }
})
export default prisma

export function getMemberPhotoOrDefault(member: Pick<Member, 'slack_photo' | 'slack_photo_small' | 'fallback_photo' | 'use_slack_photo'>, small: boolean = false): string {
    return getMemberPhoto(member, small) ?? config.default_photo
}

if (process.env.NODE_ENV != 'prod') {
    // prisma.$on('query', (e) => {
    //     logger.trace({ name: 'prisma' }, e.query)
    // })
    // prisma.$on('info', (e) => {
    //     logger.trace({ name: 'prisma' }, e.message)
    // })
    // prisma.$on('warn', (e) => {
    //     logger.warn({ name: 'prisma' }, e.message)
    // })
    // prisma.$on('error', (e) => {
    //     logger.error({ name: 'prisma' }, e.message)
    // })
}
