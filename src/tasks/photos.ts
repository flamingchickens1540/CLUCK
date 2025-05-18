import prisma from '~lib/prisma'
import logger from '~lib/logger'
import config from '~config'

export async function syncFallbackPhotos() {
    const members = await prisma.member.findMany({ select: { email: true }, where: { active: true } })
    const emails = members.filter((member) => member.email.endsWith('catlin.edu')).map((member) => member.email)
    const resp = await fetch(config.photos.url, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'x-access-token': config.photos.apikey
        },
        body: JSON.stringify(emails)
    })
    if (!resp.ok) {
        logger.error({ resp, msg: await resp.text(), status: resp.status, statustext: resp.statusText }, 'Could not fetch fallback photos')
        throw new Error('could not fetch fallback photos :(')
    }
    for (const member of await resp.json()) {
        await prisma.member.update({ where: { email: member.email }, data: { fallback_photo: member.photo } })
    }
}
