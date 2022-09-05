import type { ChatPostMessageArguments, ChatPostMessageResponse, UsersListArguments, UsersListResponse } from "@slack/web-api";
import type { Server } from 'http';
import type { SpyInstance } from 'jest-mock';

import { afterAll, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals';
import express from 'express';
import fs from 'fs';
import fetch from 'node-fetch';
import { accessFailed, accessLoggedIn, client, cronJobs, router, sendSlackMessage } from '.';
import { logMember, saveMemberLog } from './memberlog';
import { addHoursSafe } from './spreadsheet';
import { cluck_api_key } from "../../secrets/consts";

jest.mock('fs')
jest.mock('cron')
jest.mock('./memberlog')
jest.mock('./spreadsheet')

jest.mocked(fs.existsSync).mockReturnValue(false)


const test_port = 3000
const app = express()
const api_url = `http://localhost:${test_port}`

let memberSpy: SpyInstance<(options?: UsersListArguments | undefined) => Promise<UsersListResponse>>
let chatSpy: SpyInstance<(options?: ChatPostMessageArguments | undefined) => Promise<ChatPostMessageResponse>>

async function apiPost(endpoint: string, body: Record<string, unknown>) {
    return await fetch(`${api_url}/${endpoint}`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
}

beforeAll(() => {
    chatSpy = jest.spyOn(client.chat, "postMessage").mockImplementation(async () => { return { ok: true } })
    memberSpy = jest.spyOn(client.users, 'list')
    memberSpy.mockResolvedValue({
        ok: true,
        members: [{ "id": "UCHICKEN", "real_name": "Test Chicken" }]
    })


    // Stop console output during tests
    jest.spyOn(console, "log").mockImplementation(() => { })
    jest.spyOn(console, "error").mockImplementation(() => { })
})

describe('API', () => {

    let server: Server
    beforeAll(async () => {
        app.use(router)
        server = app.listen(test_port)

    })

    describe('POST /api/clock', () => {
        beforeAll(async () => {
            jest.useFakeTimers({ advanceTimers: false }).setSystemTime(new Date("2022-01-01 5:00 PM"))
        })
        beforeEach(() => {
            // Reset logged in between tests
            accessLoggedIn({})
            accessFailed([])
        })

        test('does not continue without parameters', async () => {
            let res = await apiPost('clock', { loggingin: true, api_key:cluck_api_key})
            expect(res.ok).toBeFalsy()

            res = await apiPost('clock', { name: "Test Chicken", api_key:cluck_api_key })
            expect(res.ok).toBeFalsy()

            res = await apiPost('clock', {api_key:cluck_api_key})
            expect(res.ok).toBeFalsy()
            res = await apiPost('clock', {})
            expect(res.ok).toBeFalsy()

            expect(addHoursSafe).not.toHaveBeenCalled()
            expect(accessLoggedIn()).toEqual({});
        })

        test('does not continue without authentication', async () => {
            const res = await apiPost('clock', { name:"Test Chicken", loggingin: true, api_key: "wrong" })
            expect(res.status).toBe(401)
            expect(logMember).not.toHaveBeenCalled()
            expect(accessLoggedIn()).toEqual({});
        })

        test('logs member in', async () => {
            const res = await apiPost('clock', { name: "Test Chicken", loggingin: true, api_key:cluck_api_key })
            expect(res.ok).toBeTruthy()
            expect(accessLoggedIn()).toEqual({ "Test Chicken": Date.now() })
            expect(logMember).toHaveBeenCalledTimes(1)
        })
        test('logs member out', async () => {
            const timeIn = new Date().setMinutes(new Date().getMinutes() - 10)
            accessLoggedIn({ "Test Chicken": timeIn })

            // Use mock implementation to ensure the loggedin list is updated before calling logMember
            jest.mocked(logMember).mockImplementation(async (name, loggingin, loggedin) => {
                expect(name).toEqual("Test Chicken")
                expect(loggingin).toEqual(false)
                expect(loggedin).toEqual({})
            })

            const res = await apiPost('clock', { name: "Test Chicken", loggingin: false, api_key:cluck_api_key })
            expect(res.ok).toBeTruthy()

            expect(addHoursSafe).toHaveBeenCalledTimes(1)
            expect(addHoursSafe).toHaveBeenCalledWith("Test Chicken", [], timeIn)

            expect(logMember).toHaveBeenCalledTimes(1)
            expect(accessLoggedIn()).toEqual({})
        })
        test('does not continue if member was not logged in', async () => {
            const res = await apiPost('clock', { name: "Test Chicken", loggingin: false, api_key:cluck_api_key })
            expect(res.ok).toBeTruthy()
            expect(accessLoggedIn()).toEqual({})
            expect(logMember).toHaveBeenCalledTimes(0)
        })
    })

    describe('POST /api/log', () => {
        test('returns status 200 with valid parameters', async () => {
            const res = await apiPost("log", { name: "Test Chicken", hours: 1, activity: "Test Activity", api_key:cluck_api_key })
            expect(res.ok).toBeTruthy()
            expect(addHoursSafe).toHaveBeenCalled()
        })
        test('does not continue without authentication', async () => {
            let res = await apiPost("log", { name: "Test Chicken", hours: 1, activity: "Test Activity" })
            expect(res.ok).toBeFalsy()
            res = await apiPost("log", { name: "Test Chicken", hours: 1, activity: "Test Activity", api_key: "wrong"})
            expect(res.ok).toBeFalsy()

            expect(addHoursSafe).not.toHaveBeenCalled()
        })

        test('returns status 400 without valid parameters', async () => {
            // Without name
            let res = await apiPost("log", { hours: new Date().getTime(), activity: "Test Activity", api_key:cluck_api_key })
            expect(res.ok).toBeFalsy()
            // Without hours
            res = await apiPost("log", { name: "Test Chicken", activity: "Test Activity", api_key:cluck_api_key })
            expect(res.ok).toBeFalsy()
            // Without activity
            res = await apiPost("log", { name: "Test Chicken", hours: new Date().getTime(), api_key:cluck_api_key })
            expect(res.ok).toBeFalsy()
            // Without any parameters
            res = await apiPost("log", {})
            expect(res.ok).toBeFalsy()
            // Without valid time
            res = await apiPost("log", { name: "Test Chicken", hours: "notanumber", activity: "Test Activity", api_key:cluck_api_key})
            expect(res.ok).toBeFalsy()
            
            expect(addHoursSafe).not.toBeCalled()
        })

        test('stores correct data', async () => {
            const res = await apiPost("log", { name: "Test Chicken", hours: 1, activity: "Test Activity", api_key:cluck_api_key })
            expect(res.ok).toBeTruthy()
            expect(addHoursSafe).toHaveBeenCalledTimes(1)
            expect(addHoursSafe).toHaveBeenCalledWith("Test Chicken", [], new Date("2022-01-01 4:00 PM").getTime(), Date.now(), "Test Activity")
        })
    })

    describe('POST /api/auth', () => {
        test('returns status 200 with valid key', async () => {
            const res = await apiPost("auth", { api_key:cluck_api_key })
            expect(res.status).toBe(200)
        })

        test('returns status 401 with invalid key', async () => {
            const res = await apiPost("auth", { api_key: "wrong" })
            expect(res.status).toBe(401)
        })

        test('returns status 401 with no key', async () => {
            const res = await apiPost("auth", {})
            expect(res.status).toBe(401)
        })
    })
    describe('GET /api/loggedin', () => {
        test('returns logged in users', async () => {
            const res = await fetch(`${api_url}/loggedin`)
            expect(res.ok).toBeTruthy()
            await expect(res.json()).resolves.toEqual(accessLoggedIn())
        })
    })

    describe('GET /api/ping', () => {
        test('responds with code 200', async () => {
            const res = await fetch(`${api_url}/ping`)
            expect(res.ok).toBeTruthy()
        })
    })

    afterAll(() => {
        server.close()
    })

})

describe('Tasks', () => {
    beforeEach(() => {
        // Reset variables between tests
        accessFailed([])
        accessLoggedIn({})
    })

    describe("save", () => {
        test('should attempt to save all files', () => {
            expect(cronJobs.save).toBeDefined()
            cronJobs.save()

            expect(fs.writeFileSync).toBeCalledTimes(2)
            expect(saveMemberLog).toBeCalledTimes(1)
        })
        test('should save correct values', () => {
            const timeIn = new Date("1540-1-1 12:00 AM").getTime()
            const timeOut = new Date("1540-1-1 12:15 AM").getTime()

            accessFailed([{ name: 'Test Chicken', timeIn: timeIn, timeOut: timeOut, activity: "activity" }])
            accessLoggedIn({ "Test Chicken": timeIn })

            cronJobs.save()

            const mockedWriteFileSync = jest.mocked(fs.writeFileSync)
            // Check that it saved logged in members
            expect(JSON.parse(mockedWriteFileSync.mock.calls[0][1] as string)).toEqual({ "Test Chicken": timeIn })
            // Check that it saved failed requests
            expect(JSON.parse(mockedWriteFileSync.mock.calls[1][1] as string)).toEqual([{ name: 'Test Chicken', timeIn: timeIn, timeOut: timeOut, activity: "activity" }])
        })
    })
    describe("retryFailed", () => {
        test('should remove failed requests after retrying', () => {
            accessFailed([{ name: 'Test Chicken', timeIn: Date.now(), timeOut: Date.now(), activity: "activity" }])
            cronJobs.retryFailed()
            expect(accessFailed()).toEqual([])
        })
        test('should retry failed requests', async () => {
            const timeIn = new Date("1540-1-1 12:00 AM").getTime()
            const timeOut = new Date("1540-1-1 12:15 AM").getTime()
            accessFailed([{ name: 'Test Chicken', timeIn: timeIn, timeOut: timeOut, activity: "activity" }])
            cronJobs.retryFailed()
            expect(addHoursSafe).toBeCalledTimes(1)
            await expect(addHoursSafe).toBeCalledWith('Test Chicken', [], timeIn, timeOut, "activity")
        })
    })
    describe("signout", () => {
        test('should sign out all members at midnight', async () => {
            accessLoggedIn({ "Test Chicken": Date.now() })
            cronJobs.signout()
            expect(accessLoggedIn()).toEqual({})
        })
        test('should attempt to notify members', async () => {
            accessLoggedIn({ "Test Chicken": Date.now() })
            cronJobs.signout()
            expect(accessLoggedIn()).toEqual({})
            expect(chatSpy).toBeCalledTimes(1)
        })
        test('should handle invalid member', async () => {
            accessLoggedIn({ "Test Turkey": Date.now() })
            cronJobs.signout()
            expect(accessLoggedIn()).toEqual({})
            expect(chatSpy).toBeCalledTimes(0)
        })
    })
    describe("sendSlackMessage", () => {
        test('should send message to slack', async () => {
            await sendSlackMessage('Test Chicken', 'Test Message')
            expect(chatSpy).toBeCalledTimes(1)
            expect(chatSpy).toBeCalledWith({ channel: "UCHICKEN", text: 'Test Message' })
        })

        test('should not attempt to send message if it cannot find user', async () => {
            await expect(sendSlackMessage('Test Turkey', 'Test Message')).rejects.toThrow()
            expect(chatSpy).toBeCalledTimes(0)
        })
    })
})