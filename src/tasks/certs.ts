import { setProfileAttribute } from '~slack/lib/profile'
import prisma from '~lib/prisma'
import { slack_client } from '~slack'
import config from '~config'
import { ordinal, sortCertLabels } from '~lib/util'
import logger from '~lib/logger'

const congratsMessages = [
    'Hey! Congrats @ for you new {} Cert!', // prettier don't make this one line
    'Awww, @ just got their # cert: {}! They hatch so fast... [;',
    '@. {}. Well done.',
    'Bawk bawk, bawk bawk @ bawk {} bawk, bawk SKREEEEE',
    'Friends! @ has earned a {}. May we all feast and be merry. :shallow_pan_of_food: ',
    'Congrats to @ on getting a {} certification!',
    '@ just earned a {}. Did you know: Software is the bread and butter of robotics.',
    'Cluck-tastic! @ has just achieved a {} Cert. Egg-cellent job!'
]
let announcementTimeout: NodeJS.Timeout | null = null

export function scheduleCertAnnouncement() {
    if (announcementTimeout) {
        announcementTimeout.refresh()
    } else {
        announcementTimeout = setTimeout(announceNewCerts, 1000 * 15) // Certs often get changed in bursts, don't run for each change
    }
}
export async function announceNewCerts() {
    const toAnnounce = await prisma.member.findMany({
        where: { MemberCerts: { some: { announced: false } } },
        select: {
            slack_id: true,
            first_name: true,
            MemberCerts: {
                select: { announced: true, Cert: { select: { label: true } } }
            }
        }
    })
    logger.debug({ toAnnounce }, 'Announcing new certs')
    for (const member of toAnnounce) {
        for (const cert of member.MemberCerts) {
            if (cert.announced) {
                continue
            }
            let message = congratsMessages[Math.floor(Math.random() * congratsMessages.length)] // get random message
            message = message.replace('@', member.slack_id == null ? `*${member.first_name}*` : `<@${member.slack_id}>`) // set user mention
            message = message.replace('{}', `*${cert.Cert.label}*`) // set cert name in *bold*
            message = message.replace('#', ordinal(member.MemberCerts.length)) // set cert name in *bold*
            await slack_client.chat.postMessage({ channel: config.slack.channels.celebration, text: message })
        }
        if (member.slack_id) {
            await setProfileAttribute(
                member.slack_id,
                'certs',
                member.MemberCerts.map((cert) => cert.Cert.label)
                    .sort(sortCertLabels)
                    .join(', ')
            )
        }
    }
    await prisma.memberCert.updateMany({ where: { announced: false }, data: { announced: true } })
}

export async function updateProfileCerts() {
    const members = await prisma.member.findMany({
        where: { slack_id: {not: null} },
        select: {
            slack_id: true,
            MemberCerts: {
                select: {  Cert: { select: { label: true } } }
            }
        }
    })
    for (const member of members) {
        if (member.slack_id) {
            await setProfileAttribute(
                member.slack_id,
                'certs',
                member.MemberCerts.map((cert) => cert.Cert.label)
                    .sort(sortCertLabels)
                    .join(', ')
            )
        }
    }
}