import { PrismaClient, enum_Members_team, Prisma, enum_MeetingAttendances_state } from '@prisma/client'
import { faker } from '@faker-js/faker'
import { toTitleCase } from '~lib/util'

const prisma = new PrismaClient()

async function main() {
    await seedCerts()
    // await seedMembers(25)
    await seedMemberCerts()
    // await seedLabHours(500)
    // await seedMeetings(6)
}

async function seedMembers(count: number) {
    await prisma.member.deleteMany({ where: { slack_id: null } })
    const members: Prisma.MemberCreateManyInput[] = []
    for (let i = 0; i < count; i++) {
        const first = faker.person.firstName()
        const last = faker.person.lastName()
        members.push({
            email: last.toLowerCase() + first.toLowerCase().slice(0, 2) + '@domain.edu',
            first_name: first,
            full_name: first + ' ' + last,
            team: Math.random() > 0.5 ? enum_Members_team.primary : enum_Members_team.junior,
            grade: faker.number.int({ min: 8, max: 12 }),
            years: faker.number.int({ min: 1, max: 4 }),
            use_slack_photo: false
        })
    }
    await prisma.member.createMany({ data: members })
}
const cert_departments: [string, string][] = [
    ['fab', 'fab'],
    ['design', 'dsn'],
    ['strategy', 'strat'],
    ['media', 'media'],
    ['robot software', 'rsw'],
    ['controls', 'ctrls'],
    ['pneumatics', 'pnu'],
    ['app software', 'asw'],
    ['outreach', 'outrch'],
    ['awards', 'award'],
    ['executive', 'exec']
]

const standalone_certs: [string, string][] = [
    ['safety captain', '_safety'],
    ['copresident', '_copres']
]
async function seedCerts() {
    await prisma.cert.deleteMany()
    const certs: Prisma.CertCreateManyInput[] = []
    cert_departments.forEach(([name, shortname]) => {
        for (let i = 1; i <= 3; i++) {
            certs.push({
                id: shortname.toUpperCase() + '_' + i,
                label: toTitleCase(name) + ' ' + i,
                replaces: i > 1 ? shortname.toUpperCase() + '_' + (i - 1) : null,
                managerCert: shortname.toUpperCase() + '_MGR'
            })
        }
        certs.push({
            id: shortname.toUpperCase() + '_MGR',
            label: toTitleCase(name) + ' Manager',
            isManager: true
        })
    })
    standalone_certs.forEach(([name, shortname]) => {
        certs.push({
            id: shortname.toUpperCase(),
            label: toTitleCase(name)
        })
    })
    await prisma.cert.createMany({ data: certs })
}

async function seedLabHours(count: number) {
    await prisma.hourLog.deleteMany({ where: { type: 'lab' } })
    const members = await prisma.member.findMany()
    const randomEmail = () => {
        const i = Math.round(Math.random() * (members.length - 1))
        return members[i].email
    }
    const hourlogs: Prisma.HourLogCreateManyInput[] = []
    for (let i = 0; i < count; i++) {
        const time_in = faker.date.recent({ days: 15 })
        const duration = faker.number.float({ min: 0.2, max: 4, fractionDigits: 2 })
        hourlogs.push({
            member_id: randomEmail(),
            time_in: faker.date.recent({ days: 15 }),
            time_out: new Date(time_in.getTime() + duration * 60 * 60 * 1000),
            type: 'lab',
            state: 'complete',
            duration: new Prisma.Decimal(duration)
        })
    }
    await prisma.hourLog.createMany({ data: hourlogs })
}

async function seedMemberCerts() {
    await prisma.memberCert.deleteMany()
    const members = await prisma.member.findMany()
    const input: Prisma.MemberCertCreateManyInput[] = []
    members.forEach((member) => {
        cert_departments.forEach((dept) => {
            let level = null
            switch (Math.round(Math.random() * 14)) {
                case 0:
                case 1:
                case 2:
                    level = 1
                    break
                case 3:
                case 4:
                    level = 2
                    break
                case 5:
                    level = 3
            }
            if (level == 3 && Math.random() < 0.5) {
                input.push({
                    member_id: member.email,
                    cert_id: dept[1].toUpperCase() + '_MGR',
                    announced: true
                })
            }
            if (level != null) {
                input.push({
                    member_id: member.email,
                    cert_id: dept[1].toUpperCase() + '_' + level,
                    announced: true
                })
            }
        })
    })
    await prisma.memberCert.createMany({ data: input })
}

const MEETING_SPACING = 1000 * 60 * 60 * 24 * 7
async function seedMeetings(count: number) {
    await prisma.meetings.deleteMany()
    await prisma.meetingAttendanceEntry.deleteMany()

    const newMeetings: Prisma.MeetingsCreateManyInput[] = []
    let meetingDate = Date.now() - count * MEETING_SPACING
    for (let i = 0; i < count; i++) {
        newMeetings.push({
            date: new Date(meetingDate),
            mandatory: true
        })
        meetingDate += MEETING_SPACING
    }
    const meetings = await prisma.meetings.createManyAndReturn({
        select: { id: true },
        data: newMeetings
    })

    const newMeetingAttendance: Prisma.MeetingAttendanceEntryCreateManyInput[] = []
    const members = await prisma.member.findMany({ select: { email: true } })
    meetings.forEach((meeting, i) => {
        if (i + 1 == count) {
            return // don't fill for last meeting
        }
        members.forEach((member) => {
            const rand = Math.random()
            let state: enum_MeetingAttendances_state = enum_MeetingAttendances_state.present
            if (rand < 0.3) state = enum_MeetingAttendances_state.absent
            if (rand < 0.05) state = enum_MeetingAttendances_state.no_credit

            newMeetingAttendance.push({
                state: state,
                meeting_id: meeting.id,
                member_id: member.email
            })
        })
    })
    await prisma.meetingAttendanceEntry.createMany({ data: newMeetingAttendance })
}

await main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
