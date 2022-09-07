import { expect, test, jest } from '@jest/globals';

import fs from 'fs';

import collect from './collector';
jest.mock('fs')

test('should save members as json', async () => {
    await collect()
    // Check that it attempted to save the file once
    expect(fs.writeFileSync).toBeCalledTimes(1);
    // Check that it saved an array of members
    const expectedResult = {
        name: expect.stringMatching(/.+/),
        firstname: expect.stringMatching(/\w+/),
        img: expect.stringMatching(/https?:\/\/.+\.png/),
    }
    const results = JSON.parse(jest.mocked(fs.writeFileSync).mock.calls[0][1] as string)
    expect(results).toEqual(expect.arrayContaining([expectedResult]))
})