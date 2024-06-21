import { Member, PrismaClient } from '@prisma/client'
import { default_photo, default_photo_small } from '@config'
export const prisma = new PrismaClient()
export default prisma

export function getMemberPhoto(member: Pick<Member, 'slack_photo' | 'slack_photo_small' | 'fallback_photo' | 'use_slack_photo'>, small: boolean = false): string {
    if (member.use_slack_photo) {
        return (small ? member.slack_photo_small : member.slack_photo) ?? member.fallback_photo ?? default_photo
    } else {
        return member.fallback_photo ?? default_photo_small
    }
}
