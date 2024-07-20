import prisma from '~lib/prisma'
import { Prisma } from '@prisma/client'
import { Bits, BlockBuilder, Blocks, Elements, OptionBuilder } from 'slack-block-builder'

export async function getDepartmentPicker(user: Prisma.MemberWhereUniqueInput): Promise<BlockBuilder[]> {
    const member = await prisma.member.findUnique({
        where: user,
        select: {
            Departments: {
                select: {
                    department_id: true
                }
            }
        }
    })

    const departments = await prisma.department.findMany()

    if (!member) {
        return [Blocks.Header().text('No member found')]
    }
    const optionMap: Record<string, OptionBuilder> = {}
    departments.forEach((d) => {
        optionMap[d.id] = Bits.Option().text(d.name).value(d.id)
    })
    const initialOptions = member.Departments.map((d) => optionMap[d.department_id])
    const options = Object.values(optionMap)

    return [
        Blocks.Input()
            .label('Select your departments')
            .blockId('department')
            .optional()
            .element(Elements.StaticMultiSelect().actionId('department').options(options).initialOptions(initialOptions))
    ]
}
