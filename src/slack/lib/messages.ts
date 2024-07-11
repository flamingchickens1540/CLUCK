export function sanitizeCodeblock(activity: string): string {
    return activity.replace('`', "'")
}

export function formatDuration(hrs: number, mins?: number): string {
    if (typeof mins === 'undefined') {
        const mins_cached = hrs * 60
        hrs = Math.floor(Math.abs(mins_cached) / 60) * Math.sign(mins_cached)
        mins = Math.round(mins_cached % 60)
    }
    const hours = hrs === 1 ? '1 hour' : `${hrs} hours`
    const minutes = mins === 1 ? '1 minute' : `${mins} minutes`

    if (hrs === 0) {
        return minutes
    } else if (mins === 0) {
        return hours
    } else {
        return `${hours} and ${minutes}`
    }
}

export function formatList(names: string[]): string {
    if (names.length === 1) {
        return names[0]
    } else if (names.length === 2) {
        return `${names[0]} and ${names[1]}`
    } else {
        return `${names.slice(0, names.length - 1).join(', ')}, and ${names[names.length - 1]}`
    }
}
