import { Hono } from 'hono'
import { safeParseInt } from '~lib/util'
import prisma from '~lib/prisma'
import { getColor } from '~routes/admin/membercerts'

export const router = new Hono().basePath('/certs')

router
    .get('/', async (c) => {
        const certs = await prisma.cert.findMany({ orderBy: { id: 'asc' } })
        const certDepartments: { id: string; label: string }[] = []
        const colors: Record<string, string> = {}
        certs.forEach((cert) => {
            if (cert.isManager) {
                colors[cert.id] = getColor(certDepartments.length)
                certDepartments.push({ id: cert.id, label: cert.label.replace('Manager', '').trim() })
            }
        })
        colors[''] = getColor(certDepartments.length)

        const rows = [...(await prisma.cert.findMany({ orderBy: { id: 'asc' } })), { id: '', label: '', managerCert: null, isManager: false }].map((cert, i) => (
            <form target="_self" method="post" name={`cert-${i}`} autocomplete="off" class={`grid grid-cols-subgrid col-span-5 border-t-2 ${colors[cert.managerCert ?? '']} gap-2 p-3`}>
                <div class="flex flex-row items-center justify-center gap-3">
                    <input required placeholder="FAB_1" name="id" type="text" value={cert.id} readonly={cert.id != ''} class={`bg-gray-100  rounded-lg pl-2 read-only:bg-transparent read-only:cursor-default focus:outline-0`} />
                </div>
                <input required placeholder="Fab 1" name="label" type="text" value={cert.label} class="bg-gray-100  rounded-lg pl-2" />
                <select name="managedBy" class="bg-gray-100 rounded-lg pl-2 cursor-pointer">
                    <option selected={cert.managerCert == null} value={''}></option>
                    {certDepartments.map((dept) => (
                        <option selected={cert.managerCert == dept.id} value={dept.id}>
                            {dept.label}
                        </option>
                    ))}
                </select>
                <input type="checkbox" checked={cert.isManager} name="isManager" class="rounded-lg pl-2" />
                <input type="submit" value={cert.id == '' ? 'Add' : 'Update'} class={`${colors[cert.managerCert ?? '']} brightness-75 saturate-200 hover:brightness-[0.55] rounded-lg transition-all duration-200 cursor-pointer`} />
            </form>
        ))
        return c.render(
            <>
                <iframe style="display:none" name="formframe"></iframe>
                <div class="container-xl text-center text-xl">
                    <div class="grid grid-cols-[2fr_3fr_3fr_1fr_1fr] ">
                        <div class="grid grid-cols-subgrid col-span-5 border-0 bg-gray-300 pt-5">
                            <div>ID</div>
                            <div>Label</div>
                            <div>Department</div>
                            <div>Mgr?</div>
                        </div>
                        {rows}
                    </div>
                </div>
            </>
        )
    })
    .post(async (c) => {
        const data = await c.req.parseBody()
        try {
            await prisma.cert.update({
                where: {
                    id: (data.id as string).trim().toUpperCase().replace(' ', '_')
                },
                data: {
                    label: (data.label as string).trim(),
                    managerCert: data.managedBy as string,
                    isManager: data.isManager == 'on'
                }
            })
            c.status(204)
            return c.body(null)
        } catch (e) {
            await prisma.cert.create({
                data: {
                    id: (data.id as string).trim().toUpperCase().replace(' ', '_'),
                    label: (data.label as string).trim(),
                    managerCert: data.managedBy as string,
                    isManager: data.isManager == 'on'
                }
            })
            return c.redirect(c.req.url, 302)
        }

        // return c.redirect(c.req.url, 302)
    })
