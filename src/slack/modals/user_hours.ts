import { Blocks, ViewBlockBuilder } from 'slack-block-builder'
import { calculateHours } from '~lib/hour_operations'
import { Prisma } from '@prisma/client'
import { UndefinableArray } from 'slack-block-builder/dist/internal'

export async function getUserHoursBlocks(user: Prisma.MemberWhereUniqueInput): Promise<UndefinableArray<ViewBlockBuilder>> {
    const hours = await calculateHours(user)
    if (!hours) {
        return [Blocks.Header().text('No hours found')]
    }
    return [
        Blocks.Header().text('⏳ Your Hours'),
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
        Blocks.Context().elements('Last updated ' + new Date().toLocaleTimeString())
    ]
}
