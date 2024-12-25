import type { enum_Member_Team, Member } from '@prisma/client'

export function getMemberPhoto(member: Pick<Member, 'slack_photo' | 'slack_photo_small' | 'fallback_photo' | 'use_slack_photo'>, small: boolean = false): string | null {
    let slackPhoto = member.slack_photo
    let schoolPhoto = member.fallback_photo
    if (small) {
        schoolPhoto = schoolPhoto?.replace('w_300,h_300', 'w_40,h_40') ?? null
        slackPhoto = member.slack_photo_small ?? slackPhoto
    }
    if (member.use_slack_photo) {
        return slackPhoto ?? schoolPhoto
    }
    return schoolPhoto
}

export function safeParseInt(value: unknown): number | undefined {
    if (value == null) {
        return undefined
    }
    if (typeof value === 'string') {
        const num = parseInt(value)
        return isNaN(num) ? undefined : num
    }
    if (typeof value === 'number') {
        return value
    }
}

export function safeParseFloat(value: unknown): number | undefined {
    if (value == null) {
        return undefined
    }
    if (typeof value === 'string') {
        const num = parseFloat(value)
        return isNaN(num) ? undefined : num
    }
    if (typeof value === 'number') {
        return value
    }
}

const english_ordinal_rules = new Intl.PluralRules('en', { type: 'ordinal' })
const suffixes = {
    zero: '', // Unused for english locale
    many: '', // Unused for english locale
    one: 'st',
    two: 'nd',
    few: 'rd',
    other: 'th'
}
export function ordinal(number: number): string {
    const category = english_ordinal_rules.select(number)
    const suffix = suffixes[category]
    return number + suffix
}

export function toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase())
}

export function sortCertLabels(a: string, b: string): number {
    return a[a.length - 1].localeCompare(b[b.length - 1])
}

const labels: Record<enum_Member_Team, string> = {
    community: 'Community Engineering',
    primary: '1540',
    junior: '1844',
    unaffiliated: ''
}
export function getTeamName(team?: enum_Member_Team | null) {
    return team != null ? labels[team] : null
}
