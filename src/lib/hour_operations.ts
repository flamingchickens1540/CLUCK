import prisma from '@/lib/prisma'
import { emitCluckChange } from '@/lib/sockets'
import { Prisma } from '@prisma/client'

export async function completeHourLog(email: string, isVoid: boolean): Promise<{ success: boolean; msg: string }> {
    const log = await prisma.hourLog.findFirst({ where: { state: 'pending', type: 'lab', member_id: email } })
    if (!log) {
        return { success: false, msg: 'You are not signed in' }
    }

    const now = new Date()
    const duration = (now.getTime() - log.time_in.getTime()) / 1000 / 60 / 60

    await prisma.hourLog.update({
        where: { id: log.id },
        data: {
            time_out: new Date(),
            state: 'complete',
            duration: new Prisma.Decimal(isVoid ? 0 : duration)
        }
    })
    emitCluckChange({ email, logging_in: false })
    return { success: true, msg: '' }
}
