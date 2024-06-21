import { Hono } from 'hono'
import prisma from '@/lib/prisma'
import logger from '@/lib/logger'
import { notifyCertChanged } from '@/tasks/certs'

export const router = new Hono().basePath('/membercerts')

router
    .get('/', async (c) => {
        const certs = await prisma.cert.findMany({ orderBy: { id: 'asc' }, select: { id: true, label: true } })
        const colcount = certs.length + 2
        const rows = (await prisma.member.findMany({ orderBy: { full_name: 'asc' }, select: { email: true, full_name: true, MemberCerts: { select: { cert_id: true } } } })).map((member, i) => {
            const certSet = new Set(member.MemberCerts.map((cert) => cert.cert_id))
            return (
                <form method="post" name={`member-${i}`} autocomplete="off" class={`grid grid-cols-subgrid border-t-2 border-teal-500 bg-teal-200`} style={`grid-column: span ${colcount} / span ${colcount}`}>
                    <div class="flex flex-row items-center justify-center gap-3">
                        <p class={`pl-2`}>{member.full_name}</p>
                    </div>
                    <input type="hidden" name={`${member.email}::`} value="" />
                    {certs.map((cert) => (
                        <div class="border-l pt-3 pb-3 border-teal-500 text-xl">
                            <input name={`${member.email}::${cert.id}`} checked={certSet.has(cert.id)} type="checkbox" />
                        </div>
                    ))}
                    <input type="submit" value={'Save'} class="bg-teal-400 hover:bg-teal-600 rounded-lg transition-colors duration-200 m-3" />
                </form>
            )
        })
        return c.render(
            <>
                <div class="container-xl text-center text-xl">
                    <div class="grid grid-cols-4" style={`grid-template-columns: auto repeat(${colcount - 2}, 32px) auto;`}>
                        <div class="grid grid-cols-subgrid border-0 bg-teal-300 pt-5" style={`grid-column: span ${colcount} / span ${colcount}`}>
                            <div>Member</div>
                            {certs.map((cert) => (
                                <div class="vertical-text-parent pb-1 border-l border-teal-500">
                                    <div>{cert.label}</div>
                                </div>
                            ))}
                        </div>
                        {rows}
                    </div>
                </div>
            </>
        )
    })
    .post(async (c) => {
        const data = await c.req.parseBody()
        const memberCerts: Record<string, string[]> = {}
        for (const key in data) {
            const [user, cert] = key.split('::', 2)
            memberCerts[user] ??= []
            if (cert) {
                memberCerts[user].push(cert)
            }
        }
        for (const member in memberCerts) {
            const newCerts = memberCerts[member]
            const { count: deleted } = await prisma.memberCert.deleteMany({
                where: {
                    cert_id: {
                        notIn: newCerts
                    },
                    member_id: member
                }
            })
            logger.info(`Removed ${deleted} certs from ${member}`)
            await notifyCertChanged(member, newCerts)
            const { count: created } = await prisma.memberCert.createMany({
                data: newCerts.map((cert) => ({ member_id: member, cert_id: cert })),
                skipDuplicates: true
            })
            logger.info(`Created ${created} certs for ${member}`)
        }
        return c.redirect(c.req.url, 302)
    })
