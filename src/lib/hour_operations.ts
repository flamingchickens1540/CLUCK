import prisma from '~lib/prisma'
import { emitCluckChange } from '~lib/sockets'
import { enum_HourLogs_type, Prisma } from '@prisma/client'
import { getStartDate, season_start_date, year_start_date } from '~config'

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
            state: isVoid ? 'cancelled' : 'complete',
            duration: new Prisma.Decimal(isVoid ? 0 : duration)
        }
    })
    emitCluckChange({ email, logging_in: false })
    return { success: true }
}

export async function getValidHours(user: Prisma.MemberWhereUniqueInput) {
    const member = await prisma.member.findUnique({
        where: user
    })
    if (member == null) {
        return
    }
    const hourlogs = await prisma.hourLog.findMany({
        where: {
            member_id: member.email,
            state: 'complete',
            time_in: {
                gte: getStartDate(member.team)
            }
        },
        select: { duration: true, type: true, message: true }
    })
    return hourlogs
}

export type HourCategory = enum_HourLogs_type | 'total' | 'qualifying' | 'meeting'

export async function calculateHours(input: Prisma.MemberWhereUniqueInput) {
    const member = await prisma.member.findUnique({ where: input, select: { email: true, team: true } })
    if (member == null) {
        return
    }
    const sums = await prisma.hourLog.groupBy({
        by: 'type',
        _sum: { duration: true },
        where: { state: 'complete', member_id: member.email, time_in: { gte: getStartDate(member.team) } }
    })
    const meetingCount = await prisma.meetingAttendanceEntry.count({ where: { member_id: member.email, state: 'present', Meeting: { date: { gte: getStartDate(member.team) } } } })
    const out: Record<HourCategory, number> = { outreach: 0, event: 0, external: 0, lab: 0, summer: 0, total: 0, qualifying: 0, meeting: 0.5 * meetingCount }
    sums.forEach((sum) => {
        out[sum.type] = sum._sum.duration!.toNumber()
        out.total += out[sum.type]
    })
    out.total += out.meeting
    out.qualifying = out.lab + out.external + out.meeting + out.outreach
    return out
}
export async function calculateAllSeasonHours() {
    const out: Record<string, Record<HourCategory, number>> = {}
    const robotics_totals = await prisma.hourLog.groupBy({
        by: ['member_id', 'type'],
        _sum: { duration: true },
        where: { state: 'complete', time_in: { gte: season_start_date }, Member: { OR: [{ team: 'primary' }, { team: 'junior' }] } }
    })
    const comm_totals = await prisma.hourLog.groupBy({
        by: ['member_id', 'type'],
        _sum: { duration: true },
        where: { state: 'complete', time_in: { gte: year_start_date }, Member: { team: 'community' } }
    })
    const meetings = await getMeetingsAttended()
    const buildMapFunc = (total: (typeof robotics_totals)[number]) => {
        out[total.member_id] ??= { outreach: 0, event: 0, external: 0, lab: 0, summer: 0, total: 0, qualifying: 0, meeting: 0 }
        out[total.member_id][total.type] = total._sum.duration!.toNumber()
        out[total.member_id].total += out[total.member_id][total.type]
    }
    robotics_totals.forEach(buildMapFunc)
    comm_totals.forEach(buildMapFunc)

    Object.keys(out).forEach((member) => {
        out[member].meeting = meetings[member] * 0.5
        out[member].total += out[member].meeting
        out[member].qualifying = out[member].lab + out[member].external + out[member].meeting + out[member].outreach
    })
    return out
}
export async function getWeeklyHours(): Promise<Record<string, number>> {
    const logs = await prisma.hourLog.groupBy({
        by: ['member_id'],
        where: {
            time_in: {
                gte: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7)
            },
            state: 'complete'
        },
        _sum: {
            duration: true
        }
    })
    return Object.fromEntries(logs.map((l) => [l.member_id, l._sum.duration?.toNumber() ?? 0]))
}

export async function getMeetingsAttended(): Promise<Record<string, number>> {
    const lookup: Record<string, number> = {}
    const robotics = await prisma.member.findMany({
        where: {
            active: true,
            OR: [{ team: 'primary' }, { team: 'junior' }]
        },
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
    const commEng = await prisma.member.findMany({
        where: {
            active: true,
            team: 'community'
        },
        select: {
            email: true,
            _count: {
                select: {
                    MeetingAttendances: {
                        where: {
                            state: 'present',
                            Meeting: {
                                date: {
                                    gte: year_start_date
                                }
                            }
                        }
                    }
                }
            }
        }
    })
    robotics.forEach((m) => {
        lookup[m.email] = m._count.MeetingAttendances
    })
    commEng.forEach((m) => {
        lookup[m.email] = m._count.MeetingAttendances
    })
    return lookup
}

export async function getMeetingsMissed(): Promise<Record<string, number>> {
    const meetings = await prisma.member.findMany({
        where: {
            active: true,
            OR: [{ team: 'primary' }, { team: 'junior' }]
        },
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
