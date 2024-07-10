import { Member, Prisma } from '@prisma/client'
import { Blocks, Elements, Modal } from 'slack-block-builder'
import prisma from '~lib/prisma'

export async function getUserDataModal(input: Prisma.MemberWhereUniqueInput) {
    const member = await prisma.member.findUnique({ where: input })
    if (member == null) {
        return Modal().title('Who are you?')
    }

    const createFieldSection = <T extends keyof Member>(label: string, field: T, converter: (v: Member[T]) => string) => {
        return [Blocks.Section().fields(label, converter(member[field])), Blocks.Divider()]
    }
    // prettier-ignore
    return Modal()
        .title("Your Information")
        .blocks(
            Blocks.Section().fields('*Field*', '*Value*'),
            ...createFieldSection("Join Date", 'createdAt', v => v.toLocaleDateString()),
            ...createFieldSection("Email", 'email', v => v!),
            ...createFieldSection("Slack ID", 'slack_id', v => v!),
            ...createFieldSection("Full Name", 'full_name', v => v!),
            ...createFieldSection("Grade", 'grade', v => v.toString()),
            ...createFieldSection("Experience", 'years', v => v+" years"),
            ...createFieldSection("Slack Photo Approved", 'use_slack_photo', v => v ? "Yes" : "No"),
            Blocks.Section()
                .text("Slack Photo")
                .accessory(Elements.Img().imageUrl(member.slack_photo ?? "").altText('Profile Picture')),
            Blocks.Section()
                .text("School Photo")
                .accessory(Elements.Img().imageUrl(member.fallback_photo ?? "").altText('School Photo'))

        )
}
