import { Hono } from 'hono'
import { safeParseInt } from '~lib/util'
import prisma, { getMemberPhotoOrDefault } from '~lib/prisma'
import { syncSlackMembers } from '~tasks/slack'

export const router = new Hono().basePath('/memberfields')

router
    .get('/', async (c) => {
        const rows = [
            ...(await prisma.additionalMemberField.findMany({
                orderBy: { id: 'asc' }
            })),
            {
                type: '',
                label: '',
                id: null
            }
        ].map((field, i) => (
            <form method="post" name={`field-${i}`} autocomplete="off" class="grid grid-cols-subgrid col-span-7 border-t-2 border-purple-500 gap-2 p-3 bg-purple-200">
                <input type="hidden" name="id" value={field.id ?? ''} />
                <input required placeholder="label" name="label" type="text" value={field.label} className="bg-purple-100 w-full rounded-lg pl-2" />
                <select required name="type" class="bg-purple-100 rounded-lg pl-2">
                    <option disabled selected></option>
                    <option selected={field.type == 'string'} value="string">
                        Text
                    </option>
                    <option selected={field.type == 'boolean'} value="boolean">
                        Checkbox
                    </option>
                </select>
                <input type="submit" value={field.id == null ? 'Add' : 'Save'} className="bg-purple-400 hover:bg-purple-600 rounded-lg transition-colors duration-200" />
                {field.id == null ? (
                    ''
                ) : (
                    <a href={'/admin/memberfields/' + field.id} class="edit-button bg-purple-400 hover:bg-purple-600 rounded-lg transition-colors duration-200">
                        Edit Values
                    </a>
                )}
            </form>
        ))
        return c.render(
            <>
                <div class="container-md text-center text-xl">
                    <div class="grid grid-cols-[4fr_2fr_1fr] ">
                        <div class="grid grid-cols-subgrid col-span-3 border-0 bg-purple-300 pt-5">
                            <div>Label</div>
                            <div>Type</div>
                        </div>
                        {rows}
                    </div>
                </div>
            </>,
            { js: 'js/memberfields' }
        )
    })
    .post(async (c) => {
        const data = await c.req.parseBody()
        const record = {
            label: (data.label as string).trim(),
            type: data.type as 'string' | 'boolean'
        }
        try {
            await prisma.additionalMemberField.update({ data: record, where: { id: safeParseInt(data.id) ?? -1 } })
        } catch {
            const field = await prisma.additionalMemberField.create({ data: record })
            await prisma.additionalMemberData.createMany({
                data: (await prisma.member.findMany()).map((m) => ({
                    member_id: m.email,
                    field_id: field.id,
                    value: record.type == 'string' ? '' : 'false'
                }))
            })
        }
        return c.redirect(c.req.url, 302)
    })
    .get('/:id', async (c) => {
        const field = await prisma.additionalMemberField.findUnique({ where: { id: safeParseInt(c.req.param('id')) ?? -1 } })
        if (field == null) {
            return c.redirect('/admin/memberfields', 302)
        }
        const members = await prisma.member.findMany({ select: { email: true, full_name: true, AdditionalMemberData: { where: { field_id: field.id }, select: { value: true } } } })
        const rows = members.map((member, i) => (
            <form method="post" name={`member-${i}`} autocomplete="off" class="grid grid-cols-subgrid col-span-3 border-t-2 border-purple-500 gap-2 p-3 bg-purple-200">
                <input type="hidden" name="email" value={member.email} />
                <div class="flex flex-row items-center justify-center gap-3">
                    <p class="pl-2">{member.full_name}</p>
                </div>
                <input required placeholder="value" name="value" type={field.type == 'string' ? 'text' : 'checkbox'} value={member.AdditionalMemberData[0]?.value} className="bg-purple-100 w-full rounded-lg pl-2" />
            </form>
        ))
        return c.render(
            <>
                <div class="container-md text-center text-xl">
                    <div class="grid grid-cols-[4fr_2fr_1fr] ">
                        <div class="grid grid-cols-subgrid col-span-3 border-0 bg-purple-300 pt-5">
                            <div>Member</div>
                            <div>Value</div>
                        </div>
                        {rows}
                    </div>
                </div>
            </>
        )
    })
    .post('/:id', async (c) => {
        const data = await c.req.parseBody()
        await prisma.additionalMemberData.upsert({
            where: { member_id_field_id: { member_id: data.email as string, field_id: safeParseInt(c.req.param('id')) ?? -1 } },
            update: { value: data.value as string },
            create: { member_id: data.email as string, field_id: safeParseInt(c.req.param('id')) ?? -1, value: data.value as string }
        })
        return c.redirect(c.req.url, 302)
    })
