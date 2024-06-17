
import logger from '@/lib/logger'
import { Member } from '@/lib/db/members'
import "core-js/full/set/difference";

const congratsMessages = [
    'Hey! Congrats @ for you new {} Cert!', // prettier don't make this one line
    'Awww, @ just got a {} Cert... They hatch so fast [;',
    '@. {}. Well done.',
    'Bawk bawk, bawk bawk @ bawk {} bawk, bawk SKREEEEE',
    'Friends! @ has earned a {}. May we all feast and be merry. :shallow_pan_of_food: ',
    'Congrats to @ on getting a {} certification!',
    '@ just earned a {}. Did you know: Software is the bread and butter of robotics.'
]

export async function createCertChangeListener() {
    logger.info("Adding listener")
    Member.addHook("afterValidate", async (member: Member) => {
        logger.info('Change triggered ' + member.email)
        if (member.changed("cert_ids")) {
            const old = await Member.findOne({where: {email:member.email}});
            console.log(member)
        }

        // const userText = member.slack_id == null ? member.first_name : `<@${member.slack_id}>`
        // let message = congratsMessages[Math.floor(Math.random() * congratsMessages.length)] // get random message
        // message = message.replace('@', userText) // set user mention
        // message = message.replace('{}', `*${cert.label}*`) // set cert name in *bold*
        //
        // await getClient().chat.postMessage({ channel: slack_celebration_channel, text: message })
        // if (member.slack_id) {
        //     const certs = await member.$get('certs')
        //     const certNames = []
        //     for (const membercert of certs) {
        //         const cert = await membercert.$get('cert')
        //         if (cert) {
        //             certNames.push(cert?.label)
        //         } else {
        //             logger.warn('unknown cert ' + membercert.cert_id)
        //         }
        //     }
        //     await setProfileAttribute(member.slack_id, 'certs', certNames.join(', '))
        // }
    })
}
