import { Member, PrismaClient } from '@prisma/client'
import config from '~config'
export const prisma = new PrismaClient()
export default prisma

export function getMemberPhotoOrDefault(member: Pick<Member, 'slack_photo' | 'slack_photo_small' | 'fallback_photo' | 'use_slack_photo'>, small: boolean = false): string {
    return getMemberPhoto(member, small) ?? config.default_photo
}

export function getMemberPhoto(member: Pick<Member, 'slack_photo' | 'slack_photo_small' | 'fallback_photo' | 'use_slack_photo'>, small: boolean = false): string | null {
    if (member.use_slack_photo) {
        return (small ? member.slack_photo_small : member.slack_photo) ?? member.fallback_photo
    } else {
        return member.fallback_photo
    }
}
