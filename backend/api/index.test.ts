import { beforeAll, afterAll, describe, expect, jest, test, beforeEach } from '@jest/globals';
import { ChatPostMessageArguments, ChatPostMessageResponse, UsersListArguments, UsersListResponse, WebClient } from "@slack/web-api";
import express from 'express';
import fs from 'fs';
import type { SpyInstance } from 'jest-mock';
import fetch from 'node-fetch';
import { setupApi, cronJobs, accessFailed, accessLoggedIn, sendSlackMessage, refreshSlackMemberlist } from '.';
import { token } from '../../secrets/slack_secrets';
import { logMember, saveMemberLog } from './memberlog';
import rewire from 'rewire'
import { addLabHoursSafe } from './spreadsheet';
import { Server } from 'http';

jest.mock('fs')
jest.mock('cron')
jest.mock('./memberlog')
jest.mock('./spreadsheet')

jest.mocked(fs.existsSync).mockReturnValue(false)


const test_port = 3000
const app = express()
const api_url = `http://localhost:${test_port}`

let slack_client: WebClient 
let memberSpy: SpyInstance<(options?: UsersListArguments | undefined) => Promise<UsersListResponse>> 
let chatSpy: SpyInstance<(options?: ChatPostMessageArguments | undefined) => Promise<ChatPostMessageResponse>>

beforeAll(() => {
    slack_client = new WebClient(token)
    memberSpy = jest.spyOn(slack_client.users, 'list')
    memberSpy.mockResolvedValue({
        ok: true, 
        members: [{"id":"UCHICKEN", "real_name": "Test Chicken"}]
    })
    chatSpy = jest.spyOn(slack_client.chat, "postMessage").mockImplementation(async () => {return {ok:true}})

    // Stop console output during tests
    jest.spyOn(console, "log").mockImplementation(() => { })
    jest.spyOn(console, "error").mockImplementation(() => { })
})

describe('API', () => {

    let server: Server
    beforeAll(async () => {
        await setupApi(app, slack_client)
        server = app.listen(test_port)

    })

    describe('GET /clock', () => {
        beforeAll(async () => {
            jest.useFakeTimers({ advanceTimers: false })
        })
        beforeEach(() => {
            // Reset logged in between tests
            accessLoggedIn({})
        })

        test('does not continue without name', async () => {
            const res = await fetch(`${api_url}/clock?loggingin=true`)
            expect(res.status).toBe(400)
        })
        test('does not continue without loggingin', async () => {
            const res = await fetch(`${api_url}/clock?name=Test Chicken`)
            expect(res.status).toBe(400)
        })
        test('does not continue without parameters', async () => {
            const res = await fetch(`${api_url}/clock`)
            expect(res.status).toBe(400)
        })

        test('logs member in', async () => {
            const res = await fetch(`${api_url}/clock?name=Test Chicken&loggingin=true`)
            expect(res.status).toBe(200)
            expect(accessLoggedIn()).toEqual({ "Test Chicken": Date.now() })
            expect(logMember).toHaveBeenCalledTimes(1)
        })
        test('logs member out', async () => {
            accessLoggedIn({ "Test Chicken": Date.now() })
            const res = await fetch(`${api_url}/clock?name=Test Chicken&loggingin=false`)
            expect(res.status).toBe(200)
            expect(accessLoggedIn()).toEqual({})
            expect(logMember).toHaveBeenCalledTimes(1)
            expect(logMember).toHaveBeenCalledWith("Test Chicken", false, {})
        })
        test('does not continue if member was not logged in', async () => {
            const res = await fetch(`${api_url}/clock?name=Test Chicken&loggingin=false`)
            expect(res.status).toBe(200)
            expect(accessLoggedIn()).toEqual({})
            expect(logMember).toHaveBeenCalledTimes(0)
        })
    })

    describe('GET /void', () => {
        test('removes voided user', async () => {
            accessLoggedIn({ "Test Chicken": Date.now() })
            const res = await fetch(`${api_url}/void?name=Test Chicken`)
            expect(res.status).toBe(200)
            expect(accessLoggedIn()).toEqual({})
        })
    })

    describe('GET /loggedin', () => {
        test('returns logged in users', async () => {
            const res = await fetch(`${api_url}/loggedin`)
            expect(res.status).toBe(200)
            await expect(res.json()).resolves.toEqual(accessLoggedIn())
        })
    })

    describe('GET /ping', () => {
        test('responds with code 200', async () => {
            const res = await fetch(`${api_url}/ping`)
            expect(res.status).toBe(200)
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
            let timeIn = new Date("1540-1-1 12:00 AM").getTime()
            let timeOut = new Date("1540-1-1 12:15 AM").getTime()

            accessFailed([{ name: 'Test Chicken', timeIn: timeIn, timeOut: timeOut }])
            accessLoggedIn({ "Test Chicken": timeIn })

            cronJobs.save()

            let mockedWriteFileSync = jest.mocked(fs.writeFileSync)
            // Check that it saved logged in members
            expect(JSON.parse(mockedWriteFileSync.mock.calls[0][1] as string)).toEqual({ "Test Chicken": timeIn })
            // Check that it saved failed requests
            expect(JSON.parse(mockedWriteFileSync.mock.calls[1][1] as string)).toEqual([{ name: 'Test Chicken', timeIn: timeIn, timeOut: timeOut }])
        })
    })
    describe("retryFailed", () => {
        test('should remove failed requests after retrying', () => {


            accessFailed([{ name: 'Test Chicken', timeIn: Date.now(), timeOut: Date.now() }])
            cronJobs.retryFailed()
            expect(accessFailed()).toEqual([])
        })
        test('should retry failed requests', async () => {
            let timeIn = new Date("1540-1-1 12:00 AM").getTime()
            let timeOut = new Date("1540-1-1 12:15 AM").getTime()
            accessFailed([{ name: 'Test Chicken', timeIn: timeIn, timeOut: timeOut }])
            cronJobs.retryFailed()
            expect(addLabHoursSafe).toBeCalledTimes(1)
            await expect(addLabHoursSafe).toBeCalledWith('Test Chicken', [], timeIn, timeOut)
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
            expect(chatSpy).toBeCalledWith({ channel:"UCHICKEN", text: 'Test Message' })
        })

        test('should not attempt to send message if it cannot find user', async () => {
            await expect(sendSlackMessage('Test Turkey', 'Test Message')).rejects.toThrow()
            expect(chatSpy).toBeCalledTimes(0)
        })
    })
})