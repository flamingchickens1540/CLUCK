import { Context, Hono } from 'hono'
import { syncSlackMembers } from '~tasks/slack'
import { APIClockLabRequest, APIClockResponse, APIMeetingAttendance, APIMember, APIRoutes } from '~types'
import logger from '~lib/logger'
import { requireAdminAPI, requireAdminLogin, requireReadAPI, requireWriteAPI } from '~lib/auth'
import { emitCluckChange } from '~lib/sockets'
import prisma, { getMemberPhotoOrDefault } from '~lib/prisma'
import { cors } from 'hono/cors'
import { completeHourLog } from '~lib/hour_operations'
import { router as admin_api_router } from './admin'
import { router as dash_api_router } from './dash'
import { enum_MeetingAttendances_state } from '@prisma/client'

const router = new Hono()
router.route('/', admin_api_router)
router.route('/dash/', dash_api_router)
router.get('/members', requireReadAPI, async (c) => {
    const members = await prisma.member.findMany({
        select: {
            email: true,
            first_name: true,
            full_name: true,
            use_slack_photo: true,
            slack_photo: true,
            slack_photo_small: true,
            fallback_photo: true,
            MemberCerts: {
                where: {
                    Cert: {
                        isManager: true
                    }
                },
                select: {
                    cert_id: true
                }
            }
        },
        where: {
            active: true
        },
        orderBy: { full_name: 'asc' }
    })
    const resp: APIMember[] = members.map((member) => ({
        email: member.email,
        first_name: member.first_name,
        full_name: member.full_name,
        photo: getMemberPhotoOrDefault(member, false),
        photo_small: getMemberPhotoOrDefault(member, true),
        isManager: member.MemberCerts.length > 0
    }))
    return c.json(resp)
})

router.get('/members/refresh', requireReadAPI, async (c) => {
    await syncSlackMembers()
    return c.redirect('/api/members', 302)
})

router.use('/members/fallback_photos', cors({ origin: ['https://portals.veracross.com'] }))
router.post('/members/fallback_photos', requireWriteAPI, async (c) => {
    logger.info('Updating fallback photos')
    const body: Record<string, string> = await c.req.json()
    await prisma.fallbackPhoto.deleteMany({})
    const { count } = await prisma.fallbackPhoto.createMany({ data: Object.entries(body).map(([k, v]) => ({ email: k.toLowerCase(), url: v })) })
    const members = await prisma.member.findMany({ select: { email: true } })
    for (const member of members) {
        await prisma.member.update({ where: { email: member.email }, data: { fallback_photo: body[member.email.toLowerCase()] } })
    }
    return c.text(`Updated ${count} fallback photos`)
})

function clockJson(c: Context, payload: APIClockResponse) {
    return c.json(payload)
}

router
    .post('/clock/lab', requireWriteAPI, async (c) => {
        const { email, action }: APIClockLabRequest = await c.req.json()
        const member = await prisma.member.findUnique({ where: { email }, select: { email: true } })
        if (member == null) {
            logger.warn('ignoring login for unknown user ' + email)
            c.status(400)
            return clockJson(c, { success: false, error: 'member unknown' })
        }
        try {
            const log = await prisma.hourLog.findFirst({ where: { state: 'pending', type: 'lab', member_id: email } })
            if (log) {
                if (action == 'in') {
                    logger.warn('ignoring duplicate login for ' + email)
                    return clockJson(c, { success: false, error: 'member already logged in', log_id: log.id })
                }
                if (action == 'out') {
                    logger.debug('logging out ' + email)
                    await completeHourLog(email, false)
                } else if (action == 'void') {
                    logger.debug('voiding ' + email)
                    await completeHourLog(email, true)
                }
                return clockJson(c, { success: true, log_id: log.id })
            } else if (action == 'in') {
                logger.debug('logging in ' + email)
                const newLog = await prisma.hourLog.create({
                    data: {
                        member_id: email,
                        time_in: new Date(),
                        type: 'lab',
                        state: 'pending'
                    }
                })
                emitCluckChange({ email, logging_in: true })
                return clockJson(c, { success: true, log_id: newLog.id })
            } else {
                c.status(400)
                return clockJson(c, { success: false, error: 'member not signed in' })
            }
        } catch (e) {
            logger.error(e)
            c.status(500)
            return clockJson(c, { success: false, error: 'unknown' })
        }
    })
    .get(async (c) => {
        const records = await prisma.hourLog.findMany({
            where: { state: 'pending', type: 'lab' },
            select: { id: true, member_id: true, time_in: true }
        })
        return c.json(records.map(({ id, member_id, time_in }) => ({ id, time_in, email: member_id })))
    })

router
    .post('/attendance', requireWriteAPI, async (c) => {
        const { email, state, meeting }: APIMeetingAttendance = await c.req.json()
        try {
            await prisma.meetingAttendanceEntry.upsert({
                where: {
                    meeting_id_member_id: {
                        meeting_id: meeting,
                        member_id: email
                    }
                },
                create: {
                    meeting_id: meeting,
                    member_id: email,
                    state
                },
                update: {
                    state
                }
            })
            return c.json({ success: true, error: null })
        } catch (e) {
            logger.error(e, 'POST /attendance failed')
            c.status(500)
            return c.json({ success: false, error: e })
        }
    })
    .get(requireWriteAPI, async (c) => {
        const meeting = await prisma.meetings.findFirst({
            orderBy: {
                createdAt: 'desc'
            },
            select: {
                id: true,
                date: true,
                Attendances: {
                    select: {
                        state: true,
                        member_id: true
                    }
                }
            }
        })
        if (!meeting) {
            c.status(400)
            return c.text('No meetings found')
        }
        const map: Record<string, enum_MeetingAttendances_state> = {}
        meeting.Attendances.forEach((a) => (map[a.member_id] = a.state))
        const out: APIRoutes['/attendance']['GET']['resp'] = {
            id: meeting.id,
            label: meeting.date.toLocaleDateString(),
            attendance: map
        }
        return c.json(out)
    })
export default router
