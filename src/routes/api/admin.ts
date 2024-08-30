import { Cert, Meetings, Member, Prisma } from '@prisma/client'
import { Hono } from 'hono'
import prisma from '~lib/prisma'
import logger from '~lib/logger'
import { safeParseInt } from '~lib/util'
import { season_start_date } from '~config'

export const router = new Hono()

router
    .get('/admin/members', async (c) => {
        return c.json(
            await prisma.member.findMany({
                orderBy: { full_name: 'asc' },
                where: { active: true }
            })
        )
    })
    .post(async (c) => {
        const data = (await c.req.json()) as Partial<Member>
        const email = data.email?.trim()?.toLowerCase()
        const full_name = data.full_name?.trim()
        if (email == null || full_name == null) {
            return c.json({ success: false })
        }
        const fallback_photo = await prisma.fallbackPhoto.findUnique({ where: { email: data.email as string } })
        const record: Prisma.MemberCreateInput = {
            email,
            full_name,
            use_slack_photo: data.use_slack_photo || false,
            first_name: full_name.split(' ')[0],
            fallback_photo: fallback_photo?.url
        }
        return c.json({
            data: await prisma.member.create({ data: record }),
            success: true
        })
    })
    .put(async (c) => {
        const data = (await c.req.json()) as Partial<Member> & { id?: string }
        const id = data.id
        delete data['id']
        return c.json(await prisma.member.update({ data, where: { email: id } }))
    })

router
    .get('/admin/departments', async (c) => {
        return c.json(await prisma.department.findMany())
    })
    .put(async (c) => {
        const data = (await c.req.json()) as Partial<Prisma.DepartmentUpdateInput> & { id: string }
        try {
            return c.json(await prisma.department.update({ data, where: { id: data.id } }))
        } catch (err) {
            logger.warn({ msg: 'Error on PUT /admin/departments', err, data })
            return c.json({ error: err }, 400)
        }
    })
    .post(async (c) => {
        const data = (await c.req.json()) as Prisma.DepartmentCreateInput
        if (data.id == null || data.name == null) {
            return c.json({ error: 'Invalid data' }, 400)
        }
        data.slack_group = null // Will be created automatically
        try {
            return c.json({
                data: await prisma.department.create({ data }),
                success: true
            })
        } catch (err) {
            logger.warn({ msg: 'Error on POST /admin/departments', err, data })
            return c.json({ error: err }, 400)
        }
    })

router
    .get('/admin/certs', async (c) => {
        return c.json(await prisma.cert.findMany())
    })
    .put(async (c) => {
        const data = (await c.req.json()) as Partial<Cert>
        try {
            return c.json(await prisma.cert.update({ data, where: { id: data.id } }))
        } catch (err) {
            logger.warn({ msg: 'Error on PUT /admin/certs', err, data })
            return c.json({ error: err }, 400)
        }
    })
    .post(async (c) => {
        const data = (await c.req.json()) as Prisma.CertCreateInput

        if (data.id == null || data.label == null || data.isManager == null) {
            return c.json({ error: 'Invalid data' }, 400)
        }
        try {
            return c.json({
                data: await prisma.cert.create({ data }),
                success: true
            })
        } catch (err) {
            logger.warn({ msg: 'Error on POST /admin/certs', err, data })
            return c.json({ error: err }, 400)
        }
    })

router
    .get('/admin/meetings', async (c) => {
        return c.json(await prisma.meetings.findMany({ orderBy: { date: 'asc' }, where: { date: { gte: season_start_date } } }))
    })
    .put(async (c) => {
        const data = (await c.req.json()) as Partial<Meetings>
        try {
            return c.json(await prisma.meetings.update({ data, where: { id: data.id } }))
        } catch (err) {
            logger.warn({ msg: 'Error on PUT /admin/meetings', err, data })
            return c.json({ error: err }, 400)
        }
    })
    .delete(async (c) => {
        const data = (await c.req.json()) as { id: unknown }
        try {
            return c.json(await prisma.meetings.delete({ where: { id: safeParseInt(data.id) } }))
        } catch (err) {
            logger.warn({ msg: 'Error on DELETE /admin/meetings', err, data })
            return c.json({ error: err }, 400)
        }
    })
