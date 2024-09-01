import prisma from '~lib/prisma'
import logger from '~lib/logger'

export async function syncFallbackPhotos() {
    const members = await prisma.member.findMany({ select: { email: true } })

    for (const member of members) {
        const fallbackPhoto = await prisma.fallbackPhoto.findUnique({ where: { email: member.email } })
        if (!fallbackPhoto) {
            logger.warn('Could not find photo for ' + member.email)
        } else {
            await prisma.member.update({ where: { email: member.email }, data: { fallback_photo: fallbackPhoto?.url } })
        }
    }
}
