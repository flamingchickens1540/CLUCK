import { beforeEach, beforeAll, afterAll, describe, expect, jest, test } from '@jest/globals';
import * as spreadsheet from './spreadsheet';
import fs from 'fs'
import { getMemberlog, logMember, saveMemberLog, setMemberlog } from './memberlog';

jest.mock('fs')
jest.mock('./spreadsheet')

beforeEach(() => {
    // Reset memberlog between tests
    setMemberlog([])
})

describe("logMember", () => {
    beforeAll(() => {
        // Prevent time from changing during tests
        jest.useFakeTimers({advanceTimers:false})
    })
    
    afterAll(() => {
        // Allow time to change again
        jest.useRealTimers()
    })

    test("should add members to spreadsheet", async () => {
        await logMember("Test Chicken", true, {"Test Chicken": Date.now()})
        expect(spreadsheet.updateLoggedIn).toBeCalledTimes(1)
        expect(spreadsheet.updateLoggedIn).toBeCalledWith({ "Test Chicken": Date.now() })
    })  
    
    test("should remove members from spreadsheet", async () => {
        await logMember("Test Chicken", false, {})
        expect(spreadsheet.updateLoggedIn).toBeCalledTimes(1)
        expect(spreadsheet.updateLoggedIn).toBeCalledWith({})
    })  
    
    test("should update memberlog", async () => {
        await logMember("Test Chicken", true, {})
        expect(getMemberlog()).toContainEqual( { loggingin:true, name: "Test Chicken", time: Date.now() })
    })
})

describe("saveMemberLog", () => {
    test("should save current member log", async () => {
        // Create dummy member log
        let memberlog = { loggingin:true, name: "Test Chicken", time: Date.now() }
        setMemberlog([memberlog]);

        await saveMemberLog()
        
        expect(fs.appendFileSync).toBeCalledTimes(1)
        let mockedAppendFileSync = jest.mocked(fs.appendFileSync)
        expect(JSON.parse(mockedAppendFileSync.mock.calls[0][1] as string)).toEqual(memberlog)
    })
})