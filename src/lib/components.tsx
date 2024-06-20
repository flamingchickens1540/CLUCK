import { Member } from '@prisma/client'
import { getMemberPhoto } from '@/lib/db'
import { JSX, JSXNode } from 'hono/jsx'

export function getStudentCard(member: Pick<Member, 'slack_id' | 'email' | 'use_slack_photo' | 'slack_photo' | 'slack_photo_small' | 'fallback_photo'>, ...children: unknown[]) {
    return (
        <div class="flex flex-row items-center justify-center gap-3">
            <img class={`w-10 h-10 object-cover object-top -m-1 rounded-full border-4 ${member.slack_id == null ? 'border-red-600' : 'border-green-600'}`} alt={member.slack_id == null ? 'Slack not found' : 'Slack connected'} src={getMemberPhoto(member, true)} />
            {children}
        </div>
    )
}
