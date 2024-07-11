import { Prisma } from '@prisma/client'
import QuickChart from 'quickchart-js'
import prisma from '~lib/prisma'

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
            return i % 2 == 0 ? new Date(this.start.getTime() + i * this.group_size).toLocaleDateString('en-us', { month: 'short', day: 'numeric' }) : ''
        })
    }
}

export async function createHoursChart(slack_ids: string[]) {
    const hourLogs = await prisma.hourLog.findMany({
        select: {
            duration: true,
            time_in: true
        },
        where: {
            state: 'complete',
            Member: {
                slack_id: {
                    in: slack_ids
                }
            }
        },
        orderBy: {
            time_in: 'asc'
        }
    })
    const aggregator = new HourAggregator(hourLogs[0].time_in, hourLogs[hourLogs.length - 1].time_in)
    hourLogs.forEach((log) => aggregator.add(log.time_in, log.duration!.toNumber()))

    const myChart = new QuickChart()
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
    return await myChart.getShortUrl()
}
