import { MemberCert } from '@/lib/db/certs'
import { getClient, setProfileAttribute } from '@/lib/slack'
import { slack_celebration_channel, slack_profile_fields } from '@config'
import logger from '@/lib/logger'

const congratsMessages = ['Hey! Congrats @ for you new {} Cert!', 'Awww, @ just got a {} Cert... They hatch so fast [;', '@. {}. Well done.', 'Bawk bawk, bawk bawk @ bawk {} bawk, bawk SKREEEEE', 'Friends! @ has earned a {}. May we all feast and be merry. :shallow_pan_of_food: ', 'Congrats to @ on getting a {} certification!', '@ just earned a {}. Did you know: Software is the bread and butter of robotics.']

export async function createCertChangeListener() {
    const listener = async (membercert: MemberCert) => {
        logger.info('Change triggered ' + membercert.id)
        const member = (await membercert.$get('member'))!
        const cert = (await membercert.$get('cert'))!

        const userText = member.slack_id == null ? member.first_name : `<@${member.slack_id}>`
        let message = congratsMessages[Math.floor(Math.random() * congratsMessages.length)] // get random message
        message = message.replace('@', userText) // set user mention
        message = message.replace('{}', `*${cert.label}*`) // set cert name in *bold*

        await getClient().chat.postMessage({ channel: slack_celebration_channel, text: message })
        if (member.slack_id) {
            const certs = await member.$get('certs')
            const certNames = []
            for (const membercert of certs) {
                const cert = await membercert.$get('cert')
                if (cert) {
                    certNames.push(cert?.label)
                } else {
                    logger.warn('unknown cert ' + membercert.cert_id)
                }
            }
            await setProfileAttribute(member.slack_id, 'certs', certNames.join(', '))
        }
    }
    MemberCert.afterCreate(listener)
    MemberCert.afterUpdate(listener)
}
