import { expect, test } from 'vitest'

import { parseArgs } from '@/slack/handlers/log'

test('parses /log arguments', () => {
    expect(parseArgs('3h30m lots of working').activity).toBe('lots of working')
    expect(parseArgs('3h30m lots of working').hours).toBeCloseTo(3.5, 3)
    expect(parseArgs('3h 30m lots of working').activity).toBe('lots of working')
    expect(parseArgs('3h 30m lots of working').hours).toBeCloseTo(3.5, 3)
    expect(parseArgs('30hm lots of working').hours).toBe(0)
    expect(parseArgs('30mh 3h lots of working').hours).toBe(0)
    expect(parseArgs('30h 3h lots of working').activity).toBe('3h lots of working')
    expect(parseArgs('30h 3h lots of working').hours).toBe(30)
    expect(parseArgs('lots of working').hours).toBe(0)
})
