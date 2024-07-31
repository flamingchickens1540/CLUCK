import { Prisma } from '@prisma/client'
import QuickChart from 'quickchart-js'
import prisma from '~lib/prisma'
import { season_start_date } from '~config'

class HourAggregator {
    private readonly group_size: number
    private readonly values: number[]

    constructor(
        private start: Date,
        end: Date
    ) {
        const diff = end.getTime() - start.getTime()
        this.group_size = diff / 100
        this.values = new Array(100).fill(0)
    }

    add(date: Date, value: number) {
        const index = Math.floor((date.getTime() - this.start.getTime()) / this.group_size)
        this.values[index] += value
    }

    getCumulative() {
        let running = 0
        return this.values.map((dayVal) => {
            running += dayVal
            return Math.round(running * 10) / 10
        })
    }
    getLabels() {
        return this.values.map((_, i) => {
            return i % 3 == 0 ? new Date(this.start.getTime() + i * this.group_size).toLocaleDateString('en-us', { month: 'short', day: 'numeric' }) : ''
        })
    }
}

export async function createHourChartForUsers(userIds: string[]) {
    const hourLogs = await prisma.hourLog.findMany({
        where: {
            Member: {
                slack_id: {
                    in: userIds
                }
            }
        },
        select: {
            time_in: true,
            duration: true
        },
        orderBy: {
            time_in: 'asc'
        }
    })
    return await createHourChart(hourLogs)
}

export async function createHourChartForTeam(team: 'primary' | 'junior' | 'all') {
    const where: Prisma.HourLogWhereInput = {
        time_out: { gte: season_start_date }
    }
    if (team != 'all') {
        where.Member = { team }
    }
    const hourLogs = await prisma.hourLog.findMany({
        where,
        select: {
            time_in: true,
            duration: true
        },
        orderBy: {
            time_in: 'asc'
        }
    })
    return await createHourChart(hourLogs)
}

async function createHourChart(hourLogs: { time_in: Date; duration: Prisma.Decimal | null }[]): Promise<{
    url: string
    success: boolean
}> {
    if (hourLogs.length < 2) {
        return { url: 'https://picsum.photos/id/22/1000/600.jpg', success: false }
    }
    const aggregator = new HourAggregator(hourLogs[0].time_in, hourLogs[hourLogs.length - 1].time_in)
    hourLogs.forEach((log) => aggregator.add(log.time_in, log.duration!.toNumber()))

    const myChart = new QuickChart()
    myChart.setWidth(1000)
    myChart.setHeight(600)
    myChart.setConfig({
        type: 'line',
        options: {
            title: {
                display: true,
                text: 'Hours'
            },
            legend: {
                display: false
            },
            scales: {
                xAxis: {
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                yAxes: [
                    {
                        title: {
                            display: true,
                            text: 'Hours'
                        },
                        ticks: {
                            beginAtZero: true,
                            display: false
                        }
                    }
                ]
            }
        },
        data: {
            labels: aggregator.getLabels(),
            datasets: [
                {
                    label: 'Hours',
                    fill: true,
                    lineTension: 0.3,
                    data: aggregator.getCumulative(),
                    pointRadius: 0
                }
            ]
        }
    })
    return { url: await myChart.getShortUrl(), success: true }
}
