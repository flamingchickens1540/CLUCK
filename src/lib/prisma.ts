import { Member, PrismaClient } from '@prisma/client'
import config from '~config'
import { getMemberPhoto } from '~lib/util'
export const prisma = new PrismaClient()
export default prisma

export function getMemberPhotoOrDefault(member: Pick<Member, 'slack_photo' | 'slack_photo_small' | 'fallback_photo' | 'use_slack_photo'>, small: boolean = false): string {
    return getMemberPhoto(member, small) ?? config.default_photo
}
