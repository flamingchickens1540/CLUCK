import prisma from '~lib/prisma'
import { emitCluckChange } from '~lib/sockets'
import { enum_HourLogs_type, Prisma } from '@prisma/client'
import { season_start_date } from '~config'

export enum HourError {
    NOT_SIGNED_IN
}

export async function completeHourLog(email: string, isVoid: boolean): Promise<{ success: true } | { success: false; error: HourError }> {
    const log = await prisma.hourLog.findFirst({ where: { state: 'pending', type: 'lab', member_id: email } })
    if (!log) {
        return { success: false, error: HourError.NOT_SIGNED_IN }
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
    return { success: true }
}

export async function getValidHours(user: Prisma.MemberWhereUniqueInput) {
    const member = await prisma.member.findUnique({
        where: user,
        include: {
            HourLogs: {
                where: {
                    state: 'complete',
                    time_in: {
                        gte: season_start_date
                    }
                },
                select: { duration: true, type: true, message: true }
            }
        }
    })
    if (member == null) {
        return
    }
    return member.HourLogs
}

export async function calculateHours(user: Prisma.MemberWhereUniqueInput) {
    if (user.email == null) {
        const member = await prisma.member.findUnique({ where: user })
        if (member == null) {
            return
        }
        user.email = member.email
    }
    const sums = await prisma.hourLog.groupBy({ by: 'type', _sum: { duration: true }, where: { state: 'complete', member_id: user.email, time_out: { gte: season_start_date } } })
    const out: Record<enum_HourLogs_type | 'total' | 'qualifying', number> = { event: 0, external: 0, lab: 0, summer: 0, total: 0, qualifying: 0 }
    sums.forEach((sum) => {
        out[sum.type] = sum._sum.duration!.toNumber()
        out.total += out[sum.type]
    })
    out.qualifying = out.lab + out.external
    return out
}
export async function calculateAllHours() {
    const out: Record<string, Record<enum_HourLogs_type | 'total' | 'qualifying', number>> = {}
    const totals = await prisma.hourLog.groupBy({
        by: ['member_id', 'type'],
        _sum: { duration: true },
        where: { state: 'complete', time_in: { gte: season_start_date } }
    })
    totals.forEach((total) => {
        out[total.member_id] ??= { event: 0, external: 0, lab: 0, summer: 0, total: 0, qualifying: 0 }
        out[total.member_id][total.type] = total._sum.duration!.toNumber()
        out[total.member_id].total += out[total.member_id][total.type]
        out[total.member_id].qualifying = out[total.member_id].lab + out[total.member_id].external
    })
    return out
}
export async function getWeeklyHours(): Promise<Record<string, number>> {
    const logs = await prisma.hourLog.groupBy({
        by: ['member_id'],
        where: {
            time_in: {
                gte: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7)
            }
        },
        _sum: {
            duration: true
        }
    })
    return Object.fromEntries(logs.map((l) => [l.member_id, l._sum.duration?.toNumber() ?? 0]))
}

export async function getMeetings(): Promise<Record<string, number>> {
    const meetings = await prisma.member.findMany({
        select: {
            email: true,
            _count: {
                select: {
                    MeetingAttendances: {
                        where: {
                            state: 'present',
                            Meeting: {
                                date: {
                                    gte: season_start_date
                                }
                            }
                        }
                    }
                }
            }
        }
    })
    return Object.fromEntries(meetings.map((m) => [m.email, m._count.MeetingAttendances]))
}

export async function getMeetingsMissed(): Promise<Record<string, number>> {
    const meetings = await prisma.member.findMany({
        select: {
            email: true,
            _count: {
                select: {
                    MeetingAttendances: {
                        where: {
                            state: {
                                not: 'present'
                            },
                            Meeting: {
                                mandatory: true,
                                date: {
                                    gte: season_start_date
                                }
                            }
                        }
                    }
                }
            }
        }
    })

    return Object.fromEntries(meetings.map((m) => [m.email, m._count.MeetingAttendances]))
}
