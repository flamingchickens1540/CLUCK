import { Hono } from 'hono'
import prisma from '~lib/prisma'

export const router = new Hono()

router.get('/admin/members', async (c) => {
    return c.json(
        await prisma.member.findMany({
            orderBy: { full_name: 'asc' }
        })
    )
})
