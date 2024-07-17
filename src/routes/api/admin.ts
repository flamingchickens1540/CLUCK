import { Cert, Member, Prisma } from '@prisma/client'
import { Hono } from 'hono'
import prisma from '~lib/prisma'
import { safeParseInt } from '~lib/util'

export const router = new Hono()

router
    .get('/admin/members', async (c) => {
        return c.json(
            await prisma.member.findMany({
                orderBy: { full_name: 'asc' }
            })
        )
    })
    .post(async (c) => {
        const data = (await c.req.json()) as Partial<Member>
        console.log(data)
        const email = data.email?.trim()
        const full_name = data.full_name?.trim()
        const years = safeParseInt(data.years)
        const grade = safeParseInt(data.grade)
        const team = data.team?.toLowerCase() ?? 'junior'
        if (email == null || full_name == null || years == null || grade == null || (team != 'primary' && team != 'junior')) {
            return c.json({ success: false })
        }
        const fallback_photo = await prisma.fallbackPhoto.findUnique({ where: { email: data.email as string } })
        const record: Prisma.MemberCreateInput = {
            email,
            full_name,
            years,
            grade,
            team,
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
        if (data.grade && data.grade < 0) {
            data.grade = 0
        }
        return c.json(await prisma.member.update({ data, where: { email: id } }))
    })

router
    .get('/admin/certs', async (c) => {
        return c.json(await prisma.cert.findMany())
    })
    .put(async (c) => {
        try {
            const data = (await c.req.json()) as Partial<Cert>
            console.log(data)
            return c.json(await prisma.cert.update({ data, where: { id: data.id } }))
        } catch (e: unknown) {
            console.log(e)
            return c.json({ error: e }, 400)
        }
    })
    .post(async (c) => {
        const data = (await c.req.json()) as Prisma.CertCreateInput

        if (data.id == null || data.label == null || data.isManager == null) {
            return c.json({ error: 'Invalid data' }, 400)
        }

        console.log(data)
        try {
            return c.json({
                data: await prisma.cert.create({ data }),
                success: true
            })
        } catch (e: unknown) {
            console.log(e)
            return c.json({ error: e }, 400)
        }
    })
