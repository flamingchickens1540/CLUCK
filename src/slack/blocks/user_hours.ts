import { Blocks, Elements, ViewBlockBuilder } from 'slack-block-builder'
import { calculateHours } from '~lib/hour_operations'
import { Prisma } from '@prisma/client'
import { UndefinableArray } from 'slack-block-builder/dist/internal'
import { ActionIDs } from '~slack/handlers'
import prisma from '~lib/prisma'

export async function getUserHoursBlocks(user: Prisma.MemberWhereUniqueInput): Promise<UndefinableArray<ViewBlockBuilder>> {
    const hours = await calculateHours(user)
    if (!hours) {
        return [Blocks.Header().text('No hours found')]
    }
    return [
        Blocks.Header().text('⏳ Your Hours'),
        Blocks.Actions().elements(Elements.Button().text('Show Pending').actionId(ActionIDs.SHOW_OWN_PENDING_REQUESTS)),
        Blocks.Section().fields('*Category*', '*Hours*'),
        Blocks.Divider(),
        Blocks.Section().fields('Lab', hours.lab.toFixed(1)),
        Blocks.Divider(),
        Blocks.Section().fields('External', hours.external.toFixed(1)),
        Blocks.Divider(),
        Blocks.Section().fields('Event', hours.event.toFixed(1)),
        Blocks.Divider(),
        Blocks.Section().fields('Summer', hours.summer.toFixed(1)),
        Blocks.Divider(),
        Blocks.Section().fields('*Total*', '*' + hours.total.toFixed(1) + '*'),
        Blocks.Divider(),
        Blocks.Section().fields('Qualifying', hours.qualifying.toFixed(1)),
        Blocks.Context().elements('excludes events and summer hours')
    ]
}

export async function getUserPendingHoursBlocks(user: Prisma.MemberWhereUniqueInput): Promise<ViewBlockBuilder[]> {
    const hours = await prisma.hourLog.findMany({
        where: {
            Member: user,
            type: { not: 'lab' },
            state: 'pending'
        },
        select: {
            id: true,
            time_in: true,
            duration: true,
            message: true
        },
        orderBy: { time_in: 'asc' }
    })
    if (hours.length == 0) {
        return [Blocks.Header().text('No pending hours found')]
    }
    return hours.flatMap((item) => [
        Blocks.Divider(),
        Blocks.Section({ text: `*${item.duration!.toNumber()} hours*\n\`\`\`${item.message}\n\`\`\`` }),
        Blocks.Context().elements(`${item.id} | Submitted ${item.time_in.toLocaleString()}`)
    ])
}
