import type { Member } from '@prisma/client'

export function getMemberPhoto(member: Pick<Member, 'slack_photo' | 'slack_photo_small' | 'fallback_photo' | 'use_slack_photo'>, small: boolean = false): string | null {
    if (member.use_slack_photo) {
        return (small ? member.slack_photo_small : member.slack_photo) ?? member.fallback_photo
    } else {
        return member.fallback_photo
    }
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
