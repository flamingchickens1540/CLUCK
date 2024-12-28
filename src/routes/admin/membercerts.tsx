import { Hono } from 'hono'
import prisma from '~lib/prisma'
import { scheduleCertAnnouncement } from '~tasks/certs'

export const router = new Hono().basePath('/membercerts/')

export const cert_colors = [
    'bg-red-200 border-red-500 accent-red-400', //
    'bg-yellow-200 border-yellow-500 accent-yellow-400',
    'bg-green-200 border-green-500 accent-green-400',
    'bg-blue-200 border-blue-500 accent-blue-400',
    'bg-purple-200 border-purple-500 accent-purple-400',
    'bg-pink-200 border-pink-500 accent-pink-400'
]
export const getColor = (i: number) => cert_colors[i % cert_colors.length]
router
    .get('/', async (c) => {
        const certs = await prisma.cert.findMany({ orderBy: [{ department: 'asc' }, { id: 'asc' }], select: { id: true, label: true, department: true, isManager: true } })
        const colcount = certs.length + 1
        const rows = (await prisma.member.findMany({ where: { active: true, OR: [{ team: 'primary' }, { team: 'junior' }] }, orderBy: { full_name: 'asc' }, select: { email: true, full_name: true, MemberCerts: { select: { cert_id: true } } } })).map((member, rowI) => {
            let colorI = -1
            const certSet = new Set(member.MemberCerts.map((cert) => cert.cert_id))
            return (
                <div method="post" name={`member-${rowI}`} autocomplete="off" class={`grid grid-cols-subgrid`} style={`grid-column: span ${colcount} / span ${colcount}`}>
                    <div class={`flex flex-row items-center justify-center bg-gray-200 gap-3 sticky left-0 z-10 border-gray-500 border-r-2 ${rowI % 2 == 0 && 'brightness-[0.85]'}`}>
                        <p class={`pl-2`}>{member.full_name}</p>
                    </div>
                    {certs.map((cert, i) => {
                        const isFirst = i == 0 || cert.department !== certs[i - 1].department
                        const isLast = i >= certs.length - 1 || cert.department !== certs[i + 1].department
                        if (isFirst) {
                            colorI++
                        }
                        return (
                            <div class={`${rowI % 2 == 0 && 'saturate-100 brightness-[0.85]'} ${isFirst ? 'border-l-2' : 'border-l'} ${isLast && 'border-r-2'} p-1 text-xl ${getColor(colorI)}`}>
                                <input class="cert-checkbox scale-150" name={`${member.email}::${cert.id}`} checked={certSet.has(cert.id)} type="checkbox" />
                            </div>
                        )
                    })}
                </div>
            )
        })
        let colorI = -1
        return c.render(
            <>
                <div class="container-xl text-center text-xl">
                    <div class="grid grid-cols-4" style={`grid-template-columns: minmax(200px, auto) repeat(${colcount - 1}, 32px);`}>
                        <div class="grid grid-cols-subgrid border-0 sticky top-0 z-20" style={`grid-column: span ${colcount} / span ${colcount}`}>
                            <div class="bg-white sticky top-0 left-0 z-30"></div>
                            {certs.map((cert, i) => {
                                const isFirst = i == 0 || cert.department !== certs[i - 1].department
                                const isLast = i >= certs.length - 1 || cert.department !== certs[i + 1].department
                                if (isFirst) {
                                    colorI++
                                }
                                return (
                                    <div class={`vertical-text-parent py-1 border-b-2 ${isFirst ? 'border-l-2' : 'border-l'} ${isLast && 'border-r-2'} ${getColor(colorI)}`}>
                                        <div class={cert.isManager ? 'font-medium' : 'font-light'}>{cert.label}</div>
                                    </div>
                                )
                            })}
                        </div>
                        {rows}
                    </div>
                </div>
            </>,
            { js: 'js/membercerts' }
        )
    })
    .post(async (c) => {
        const { email, cert, value }: { email: string; cert: string; value: boolean } = await c.req.json()
        if (value) {
            await prisma.memberCert.create({ data: { member_id: email, cert_id: cert } })
            scheduleCertAnnouncement()
        } else {
            await prisma.memberCert.delete({ where: { cert_id_member_id: { cert_id: cert, member_id: email } } })
        }
        return c.text('OK', 200)
    })
