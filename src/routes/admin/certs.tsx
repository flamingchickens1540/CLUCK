import { Hono } from 'hono'
import { safeParseInt } from '~lib/util'
import prisma from '~lib/prisma'

export const router = new Hono().basePath('/certs')

const certDepartments = ['', 'admin', 'fab', 'design', 'robot_sw', 'app_sw', 'electronics', 'pneumatics', 'outreach', 'awards']

router
    .get('/', async (c) => {
        const rows = [...(await prisma.cert.findMany({ orderBy: { id: 'asc' } })), { id: '', label: '', level: '', department: '' }].map((cert, i) => (
            <form method="post" name={`cert-${i}`} autocomplete="off" class="grid grid-cols-subgrid col-span-5 border-t-2 border-teal-500 gap-2 p-3 bg-teal-200">
                <div class="flex flex-row items-center justify-center gap-3">
                    <input required placeholder="FAB_1" name="id" type="text" value={cert.id} readonly={cert.id != ''} class={`bg-teal-100  rounded-lg pl-2 read-only:bg-teal-200 read-only:cursor-default focus:outline-0`} />
                </div>
                <input required placeholder="Fab 1" name="label" type="text" value={cert.label} class="bg-teal-100  rounded-lg pl-2" />
                <select required name="department" class="bg-teal-100 rounded-lg pl-2">
                    {certDepartments.map((dept) => (
                        <option selected={cert.department == dept} value={dept}>
                            {dept.replace('_', ' ').replace(/(^\w)|(\s+\w)/g, (letter) => letter.toUpperCase())}
                        </option>
                    ))}
                </select>
                <input required placeholder="0" name="level" type="number" value={cert.level} class="bg-teal-100  rounded-lg pl-2" />
                <input type="submit" value={cert.id == '' ? 'Add' : 'Save'} class="bg-teal-400 hover:bg-teal-600 rounded-lg transition-colors duration-200" />
            </form>
        ))
        return c.render(
            <>
                <div class="container-xl text-center text-xl">
                    <div class="grid grid-cols-[2fr_2fr_2fr_2fr_1fr] ">
                        <div class="grid grid-cols-subgrid col-span-5 border-0 bg-teal-300 pt-5">
                            <div>ID</div>
                            <div>Label</div>
                            <div>Department</div>
                            <div>Level</div>
                        </div>
                        {rows}
                    </div>
                </div>
            </>
        )
    })
    .post(async (c) => {
        const data = await c.req.parseBody()
        await prisma.cert.update({
            where: {
                id: (data.id as string).trim().toUpperCase().replace(' ', '_')
            },
            data: {
                label: (data.label as string).trim(),
                department: data.department as string,
                level: safeParseInt(data.level) ?? 0
            }
        })
        return c.redirect(c.req.url, 302)
    })
