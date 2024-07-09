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
