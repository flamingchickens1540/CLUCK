import { expect, test, vi } from 'vitest'

import { parseArgs } from '~slack/handlers/actions/log'

vi.mock(import('~slack'))

test('parses /log arguments', () => {
    expect(parseArgs('3h30m lots of working').activity).toBe('lots of working')
    expect(parseArgs('3h30m lots of working').hours).toBeCloseTo(3.5, 3)
    expect(parseArgs('3h 30m lots of working').activity).toBe('lots of working')
    expect(parseArgs('3h 30m lots of working').hours).toBeCloseTo(3.5, 3)
    expect(parseArgs('45m lots of working').hours).toBeCloseTo(0.75, 3)
    expect(parseArgs('1h45m lots of working').hours).toBeCloseTo(1.75, 3)
    expect(parseArgs('30hm lots of working').hours).toBe(0)
    expect(parseArgs('30mh 3h lots of working').hours).toBe(0)
    expect(parseArgs('30h 3h lots of working').activity).toBe('3h lots of working')
    expect(parseArgs('30h 3h lots of working').hours).toBe(30)
    expect(parseArgs('lots of working').hours).toBe(0)
})
