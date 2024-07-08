import logger from '@/lib/logger'
import 'core-js/full/set/difference'
import { setProfileAttribute } from '@/slack/lib/profile'
import prisma from '@/lib/prisma'
import { slack_client } from '@/slack'
import config from '@config'

const congratsMessages = [
    'Hey! Congrats @ for you new {} Cert!', // prettier don't make this one line
    'Awww, @ just got a {} Cert... They hatch so fast [;',
    '@. {}. Well done.',
    'Bawk bawk, bawk bawk @ bawk {} bawk, bawk SKREEEEE',
    'Friends! @ has earned a {}. May we all feast and be merry. :shallow_pan_of_food: ',
    'Congrats to @ on getting a {} certification!',
    '@ just earned a {}. Did you know: Software is the bread and butter of robotics.'
]

export async function notifyCertChanged(email: string, certs: string[]) {
    // All certs expected to be of same member
    const member = await prisma.member.findUnique({ where: { email } })
    if (member == null) {
        return
    }
    const existingCerts = await prisma.memberCert.findMany({
        where: { member_id: email },
        select: { cert_id: true }
    })
    const oldCerts = new Set(existingCerts.map((cert) => cert.cert_id))
    const newCerts = certs.filter((x) => !oldCerts.has(x))
    const labels = await prisma.cert.findMany({ where: { id: { in: certs } }, select: { id: true, label: true } })
    const labelMap = new Map(labels.map(({ id, label }) => [id, label]))
    if (newCerts.length > 0) {
        logger.info(`Announcing new certs for ${email}`)
        const userText = member.slack_id == null ? member.first_name : `<@${member.slack_id}>`
        for (const cert_id of newCerts) {
            const certLabel = labelMap.get(cert_id) ?? cert_id
            let message = congratsMessages[Math.floor(Math.random() * congratsMessages.length)] // get random message
            message = message.replace('@', userText) // set user mention
            message = message.replace('{}', `*${certLabel}*`) // set cert name in *bold*
            await slack_client.chat.postMessage({ channel: config.slack.channels.celebration, text: message })
        }
    }
    if (member.slack_id) {
        await setProfileAttribute(member.slack_id, 'certs', labels.map((cert) => cert.label).join(', '))
    }
}
