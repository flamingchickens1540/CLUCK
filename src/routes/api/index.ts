import { Context, Hono } from 'hono'
import { Member } from '@/lib/db/members'
import { syncSlackMembers } from '@/tasks/slack'
import { APIClockLabRequest, APIMember, APIClockExternalRespondRequest, APIClockExternalSubmitRequest, APIClockResponse } from 'src/types'
import logger from '@/lib/logger'
import { HourLog } from '@/lib/db/hours'
import { requireReadAPI, requireWriteAPI } from '@/lib/auth'
import { emitCluckChange } from '@/lib/sockets'

const router = new Hono()

router.get('/members', requireReadAPI, async (c) => {
    const members = await Member.findAll({ attributes: ['email', 'first_name', 'full_name', 'use_slack_photo', 'slack_photo', 'slack_photo_small', 'fallback_photo'], order: [['full_name', 'ASC']] })
    const resp: APIMember[] = members.map((member) => ({
        email: member.email,
        first_name: member.first_name,
        full_name: member.full_name,
        photo: member.photo,
        photo_small: member.photo_small
    }))
    return c.json(resp)
})

router.get('/members/refresh', requireReadAPI, async (c) => {
    await syncSlackMembers()
    return c.redirect('/api/members', 302)
})

function clockJson(c: Context, payload: APIClockResponse) {
    return c.json(payload)
}
router
    .post('/clock/lab', requireWriteAPI, async (c) => {
        const { email, action }: APIClockLabRequest = await c.req.json()
        const member = await Member.findOne({ where: { email }, attributes: ['email'] })
        if (member == null) {
            logger.warn('ignoring login for unknown user ' + email)
            c.status(400)
            return clockJson(c, { success: false, error: 'member unknown' })
        }
        try {
            const log = await HourLog.findOne({ where: { state: 'pending', type: 'lab', member_id: email } })
            if (log) {
                if (action == 'in') {
                    logger.warn('ignoring duplicate login for ' + email)
                    return clockJson(c, { success: false, error: 'member already logged in', log_id: log.id })
                }
                if (action == 'out') {
                    log.time_out = new Date()
                    log.state = 'complete'
                    log.duration = (log.time_out.getTime() - log.time_in.getTime()) / 1000 / 60 / 60
                    await log.save()
                    emitCluckChange({ email, logging_in: false })
                } else if (action == 'void') {
                    log.time_out = new Date()
                    log.state = 'cancelled'
                    log.duration = 0
                    await log.save()
                    emitCluckChange({ email, logging_in: false })
                }

                return clockJson(c, { success: true, log_id: log.id })
            } else if (action == 'in') {
                const newLog = await HourLog.create({ member_id: email, time_in: new Date(), type: 'lab', state: 'pending' })
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
        return c.json(await HourLog.findAll({ where: { state: 'pending', type: 'lab' }, attributes: ['id', ['member_id', 'email'], 'time_in'] }))
    })

router.get('/clock/external', requireReadAPI, async (c) => {
    return c.json(await HourLog.findAll({ where: { state: 'pending', type: 'external' }, attributes: ['id', ['member_id', 'email'], 'time_in', 'duration', 'slack_ts'] }))
})

router.post('/clock/external/submit', requireWriteAPI, async (c) => {
    const { email, message, hours }: APIClockExternalSubmitRequest = await c.req.json()
    const member = await Member.findOne({ where: { email }, attributes: ['email'] })
    if (member == null) {
        logger.warn('ignoring external submission for unknown user ' + email)
        c.status(400)
        return c.json({ success: false, error: 'member unknown' })
    }
    try {
        const newLog = await HourLog.create({ member_id: email, time_in: new Date(), duration: hours, message, type: 'external', state: 'pending' })
        return clockJson(c, { success: true, log_id: newLog.id })
    } catch (e) {
        logger.error(e)
        c.status(500)
        return clockJson(c, { success: false, error: 'unknown' })
    }
})

router.post('/clock/external/respond', requireWriteAPI, async (c) => {
    const { id, action, category }: APIClockExternalRespondRequest = await c.req.json()
    const log = await HourLog.findByPk(id)
    if (log == null) {
        logger.warn('Ignoring confirmation for unknown hour request ' + id)
        c.status(400)
        return clockJson(c, { success: false, error: 'request unknown' })
    }
    if (log.state != 'pending') {
        logger.warn('Received confirmation for completed hour request ' + id + '. Updating anyway...')
    }
    try {
        if (action == 'approve') {
            log.state = 'complete'
            log.time_out = new Date()
            log.type = category
            await log.save()
        } else {
            log.state = 'cancelled'
            log.time_out = new Date()
            await log.save()
        }
        return clockJson(c, { success: true, log_id: log.id })
    } catch (e) {
        logger.error(e)
        c.status(500)
        return clockJson(c, { success: false, error: 'unknown' })
    }
})
export default router
