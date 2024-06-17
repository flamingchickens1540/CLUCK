
import logger from '@/lib/logger'
import { Member } from '@/lib/db/members'
import "core-js/full/set/difference";
import { slack_celebration_channel } from '@config'
import { Cert } from '@/lib/db/certs'
import { getClient, setProfileAttribute } from '@/lib/slack'
import { Op } from 'sequelize';

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
        logger.info(member)
        if (member.changed("cert_ids")) {
            const old = await Member.findOne({where: {email:member.email}});
            if (!old) {logger.warn("no old entry for "+member.email);return}
            const oldCerts = old.certs
            const newCerts = new Set([...member.cert_ids].filter(x => !oldCerts.has(x)));
            console.log(newCerts)
            if (newCerts.size > 0) {
                const userText = old.slack_id == null ? old.first_name : `<@${old.slack_id}>`
                for (const cert_id of newCerts) {
                    const cert = await Cert.findOne({where:{id:cert_id}})
                    const certLabel = cert?.label ?? cert_id
                    let message = congratsMessages[Math.floor(Math.random() * congratsMessages.length)] // get random message
                    message = message.replace('@', userText) // set user mention
                    message = message.replace('{}', `*${certLabel}*`) // set cert name in *bold*
                    logger.info("Sending "+ message)
                    await getClient().chat.postMessage({ channel: slack_celebration_channel, text: message })
                }
                if (member.slack_id) {
                    const certs = await Cert.findAll({where:{id: {[Op.in]: member.cert_ids}}, attributes:["id", "label"]})
                    await setProfileAttribute(member.slack_id, 'certs', certs.map(cert => cert.label).join(', '))
                }
            }
        }


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
