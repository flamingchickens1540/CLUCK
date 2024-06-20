import { Hono } from 'hono'
import { safeParseInt } from '@/lib/util'
import prisma from '@/lib/db'
import { syncSlackMembers } from '@/tasks/slack'

export const router = new Hono().basePath('/members')

router
    .get('/', async (c) => {
        const rows = [...(await prisma.member.findMany({ orderBy: { full_name: 'asc' }, select: { email: true, full_name: true, grade: true, years: true, use_slack_photo: true, team: true, slack_id: true } })), { email: '', full_name: '', grade: '', years: '', use_slack_photo: false, team: '', slack_id: null }].map((member, i) => (
            <form method="post" name={`member-${i}`} autocomplete="off" class="grid grid-cols-subgrid col-span-7 border-t-2 border-purple-500 gap-2 p-3 bg-purple-200">
                <div class="flex flex-row items-center justify-center gap-3">
                    <div title={member.slack_id == null ? 'Slack not found' : 'Slack connected'} class={`w-1 h-1 ${member.slack_id == null ? 'bg-red-600' : 'bg-green-600'} p-2 rounded-full`}></div>
                    <input required placeholder="doej@catlin.edu" name="email" type="email" value={member.email} readonly={member.email != ''} class={`bg-purple-100  rounded-lg pl-2 read-only:bg-purple-200 read-only:cursor-default focus:outline-0`} />
                </div>
                <input required placeholder="John Doe" name="name" type="text" value={member.full_name} class="bg-purple-100  rounded-lg pl-2" />
                <input required placeholder="0" name="grade" type="number" value={member.grade} class="bg-purple-100  rounded-lg pl-2" />
                <input required placeholder="0" name="years" type="number" value={member.years} class="bg-purple-100  rounded-lg pl-2" />
                <select required name="team" class="bg-purple-100 rounded-lg pl-2">
                    <option disabled selected></option>
                    <option selected={member.team == 'primary'} value="primary">
                        Primary
                    </option>
                    <option selected={member.team == 'junior'} value="junior">
                        Junior
                    </option>
                </select>
                <input name="slack_photo" type="checkbox" checked={member.use_slack_photo} class="bg-purple-100 accent-purple-400 rounded-lg" />
                <input type="submit" value={member.email == '' ? 'Add' : 'Save'} class="bg-purple-400 hover:bg-purple-600 rounded-lg transition-colors duration-200" />
            </form>
        ))
        return c.render(
            <>
                <div class="container-xl text-center text-xl">
                    <div class="grid grid-cols-[3fr_3fr_1fr_1fr_1fr_1fr_1fr] ">
                        <div class="grid grid-cols-subgrid col-span-7 border-0 bg-purple-300 pt-5">
                            <div>Email</div>
                            <div>Full Name</div>
                            <div>Grade</div>
                            <div>Years On Team</div>
                            <div>Team</div>
                            <div>Use Slack Photo</div>
                        </div>
                        {rows}
                        <div class="flex justify-center items-center col-span-7 border-0 bg-purple-300 p-2 ">
                            <form action="/admin/members/refresh" method="POST">
                                <input type="submit" value="Sync Slack" class="p-1 bg-purple-400 hover:bg-purple-600 rounded-lg transition-colors duration-200" />
                            </form>
                        </div>
                    </div>
                </div>
            </>
        )
    })
    .post(async (c) => {
        const data = await c.req.parseBody()
        const record = {
            email: (data.email as string).trim(),
            full_name: (data.name as string).trim(),
            years: safeParseInt(data.years) ?? 0,
            grade: safeParseInt(data.grade) ?? 0,
            team: data.team as 'junior' | 'primary',
            use_slack_photo: data.slack_photo == 'on',
            first_name: (data.name as string).split(' ')[0]
        }
        await prisma.member.upsert({ create: record, update: record, where: { email: record.email } })
        return c.redirect(c.req.url, 302)
    })
    .post('/refresh', async (c) => {
        await syncSlackMembers()
        return c.redirect('/admin/members', 302)
    })
