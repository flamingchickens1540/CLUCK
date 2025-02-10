import { Hono } from 'hono'
import { safeParseInt } from '~lib/util'
import prisma, { getMemberPhotoOrDefault } from '~lib/prisma'
import { enum_MeetingAttendances_state } from '@prisma/client'
import { season_start_date } from '~config'

export const router = new Hono().basePath('/attendance/')

const attendanceSVGs = {
    absent: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
    ),
    no_credit: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
    ),
    present: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
    )
}
router
    .get('/', async (c) => {
        const meetings = await prisma.meetings.findMany({ orderBy: [{ date: 'desc' }, { id: 'desc' }], where: { date: { gte: season_start_date } } })
        const colcount = meetings.length + 4
        const rows = (
            await prisma.member.findMany({
                orderBy: { full_name: 'asc' },
                select: {
                    email: true,
                    full_name: true,
                    use_slack_photo: true,
                    slack_id: true,
                    slack_photo: true,
                    slack_photo_small: true,
                    fallback_photo: true,
                    MeetingAttendances: {
                        where: { Meeting: { date: { gte: season_start_date } } }
                    }
                },
                where: {
                    active: true,
                    OR: [{ team: 'primary' }, { team: 'junior' }]
                }
            })
        ).map((member) => {
            const memberMeetings = new Map(member.MeetingAttendances.map((attendance) => [attendance.meeting_id, attendance.state]))
            return (
                <div class="grid grid-cols-subgrid border-t-2 border-cyan-500 bg-cyan-200" style={`grid-column: span ${colcount} / span ${colcount}`}>
                    <div class="sticky top-0 left-0 grid grid-cols-subgrid border-r-2 border-cyan-500 col-span-2 bg-cyan-200">
                        <div class="flex flex-row items-center justify-start ml-5 gap-3">
                            <img class={`w-10 h-10 object-cover object-top -m-1 rounded-full border-4 ${member.slack_id == null ? 'border-red-600' : 'border-green-600'}`} alt={member.slack_id == null ? 'Slack not found' : 'Slack connected'} src={getMemberPhotoOrDefault(member, true)} />
                            <div class={`bg-cyan-200 rounded-lg pl-2 min-w-[40%] text-left`}>{member.full_name}</div>
                        </div>
                        <div class="text-center align-middle bg-cyan-100 rounded-lg p-1 m-2">{member.MeetingAttendances.filter((m) => m.state == 'present').length}</div>
                    </div>
                    {[{ id: -1 }, ...meetings].map((meeting) => (
                        <div class="flex justify-center align-center border-r border-cyan-500">
                            <div class="text-xl switch-toggle p-2 mx-auto">
                                <div>
                                    <input id={`${meeting.id}-${member.email}-no_credit`} form={`meeting-${meeting.id}`} name={member.email} value="no_credit" checked={memberMeetings.get(meeting.id) == 'no_credit'} type="radio" />
                                    <label title="Disruptive" class="rounded-l-lg" for={`${meeting.id}-${member.email}-no_credit`}>
                                        {attendanceSVGs.no_credit}
                                    </label>
                                </div>
                                <div>
                                    <input id={`${meeting.id}-${member.email}-absent`} form={`meeting-${meeting.id}`} name={member.email} value="absent" checked={memberMeetings.get(meeting.id) == 'absent'} type="radio" />
                                    <label title="Absent" for={`${meeting.id}-${member.email}-absent`}>
                                        {attendanceSVGs.absent}
                                    </label>
                                </div>
                                <div>
                                    <input id={`${meeting.id}-${member.email}-present`} form={`meeting-${meeting.id}`} name={member.email} value="present" checked={memberMeetings.get(meeting.id) == 'present'} type="radio" />
                                    <label title="Present" class="rounded-r-lg" for={`${meeting.id}-${member.email}-present`}>
                                        {attendanceSVGs.present}
                                    </label>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )
        })
        const now = new Date()
        const todayDate = now.getFullYear() + '-' + (now.getMonth() + 1).toString().padStart(2, '0') + '-' + now.getDate().toString().padStart(2, '0')
        return c.render(
            <>
                {meetings.map((meeting) => (
                    <form method="POST" action={`/admin/attendance/${meeting.id}`} id={`meeting-${meeting.id}`} name={`meeting-${meeting.id}`}></form>
                ))}
                <form method="POST" action={`/admin/attendance/new`} id={`meeting--1`} name={`meeting--1`}></form>
                <div class="container-xl text-center text-xl">
                    <div class="grid" style={`grid-template-columns: 300px 50px 200px repeat(${meetings.length}, 150px) auto`}>
                        <div class="grid grid-cols-subgrid border-0 bg-cyan-300" style={`grid-column: span ${colcount} / span ${colcount}`}>
                            <div class="sticky top-0 left-0 grid grid-cols-subgrid border-r-2 border-cyan-500 col-span-2 bg-cyan-300 pt-5">
                                <div>Student</div>
                            </div>
                            <div class="pb-1 pt-5 border-r border-cyan-500">
                                <input form="meeting--1" name="date" type="date" value={todayDate} />
                            </div>
                            <div class="grid grid-cols-subgrid" style={`grid-column: span ${meetings.length} / span ${meetings.length}`}>
                                {meetings.map((meeting) => (
                                    <div class="pb-1 pt-5 border-r border-cyan-500">
                                        <div>{meeting.date.toLocaleDateString('en-us', { day: 'numeric', month: 'short', timeZone: 'UTC' })}</div>
                                    </div>
                                ))}
                            </div>
                            <div class="bg-cyan-100"></div>
                        </div>
                        {rows}
                        <div class="grid grid-cols-subgrid border-0 bg-cyan-300 border-t-2 border-cyan-500" style={`grid-column: span ${colcount} / span ${colcount}`}>
                            <div class="sticky top-0 left-0 grid grid-cols-subgrid border-r-2 border-cyan-500 col-span-2 bg-cyan-300"></div>
                            <div class="border-r border-cyan-500">
                                <input form="meeting--1" type="submit" value="Create" class="m-2 p-1 bg-teal-400 hover:bg-teal-600 rounded-lg transition-colors duration-200" />
                            </div>
                            {meetings.map((meeting) => (
                                <div class="border-r border-cyan-500">
                                    <input form={`meeting-${meeting.id}`} value="Save" type="submit" className="m-2 p-1 bg-teal-400 hover:bg-teal-600 rounded-lg transition-colors duration-200 align-middle" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </>
        )
    })
    .post('/:id', async (c) => {
        console.log('handling')
        const data = await c.req.parseBody()

        const meeting_id_str = c.req.param('id')
        let meeting_id = undefined
        if (meeting_id_str == 'new') {
            const datestr = data.date + 'T00:00:00.000Z' // set to midnight in local time
            const { id } = await prisma.meetings.create({ data: { date: new Date(datestr), mandatory: true } })
            meeting_id = id
        } else {
            meeting_id = safeParseInt(meeting_id_str)
        }
        if (meeting_id) {
            const members = await prisma.member.findMany({ select: { email: true }, where: { active: true, OR: [{ team: 'primary' }, { team: 'junior' }] } })
            await prisma.$transaction([
                prisma.meetingAttendanceEntry.deleteMany({
                    where: {
                        meeting_id
                    }
                }),
                prisma.meetingAttendanceEntry.createMany({
                    data: members.map((m) => ({
                        member_id: m.email,
                        meeting_id,
                        state: (data[m.email] ?? 'absent') as enum_MeetingAttendances_state
                    })),
                    skipDuplicates: true
                })
            ])
        }
        return c.redirect('/admin/attendance/', 302)
    })
    .post('/delete/:id', async (c) => {
        const meeting_id = safeParseInt(c.req.param('id'))
        if (meeting_id) {
            await prisma.meetings.delete({ where: { id: meeting_id } })
        } else {
            c.text('Invalid meeting ID', 400)
        }
        return c.redirect('/admin/attendance/', 302)
    })
