import { afterAll, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { ChatPostMessageArguments, ChatPostMessageResponse, UsersListArguments, UsersListResponse, WebClient } from "@slack/web-api";
import express from 'express';
import fs from 'fs';
import { Server } from 'http';
import type { SpyInstance } from 'jest-mock';
import fetch from 'node-fetch';
import { accessFailed, accessLoggedIn, cronJobs, sendSlackMessage, setupApi } from '.';
import { token } from '../../../secrets/slack_secrets';
import { logMember, saveMemberLog } from './memberlog';
import { addLabHoursSafe } from './spreadsheet';

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
    chatSpy = jest.spyOn(slack_client.chat, "postMessage").mockImplementation(async () => {return {ok:true}})
    memberSpy = jest.spyOn(slack_client.users, 'list')
    memberSpy.mockResolvedValue({
        ok: true, 
        members: [{"id":"UCHICKEN", "real_name": "Test Chicken"}]
    })
    

    // Stop console output during tests
    jest.spyOn(console, "log").mockImplementation(() => { })
    // jest.spyOn(console, "error").mockImplementation(() => { })
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
            const timeIn = new Date().setMinutes(new Date().getMinutes() - 10)
            accessLoggedIn({ "Test Chicken": timeIn })
            
            // Use mock implementation to ensure the loggedin list is updated before calling logMember
            jest.mocked(logMember).mockImplementation(async (name, loggingin, loggedin) => { 
                expect(name).toEqual("Test Chicken")
                expect(loggingin).toEqual(false)
                expect(loggedin).toEqual({})
            })

            const res = await fetch(`${api_url}/clock?name=Test Chicken&loggingin=false`)
            expect(res.status).toBe(200)

            expect(addLabHoursSafe).toHaveBeenCalledTimes(1)
            expect(addLabHoursSafe).toHaveBeenCalledWith("Test Chicken", [], timeIn)
            
            expect(logMember).toHaveBeenCalledTimes(1)
            expect(accessLoggedIn()).toEqual({})
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
            const timeIn = new Date("1540-1-1 12:00 AM").getTime()
            const timeOut = new Date("1540-1-1 12:15 AM").getTime()

            accessFailed([{ name: 'Test Chicken', timeIn: timeIn, timeOut: timeOut }])
            accessLoggedIn({ "Test Chicken": timeIn })

            cronJobs.save()

            const mockedWriteFileSync = jest.mocked(fs.writeFileSync)
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
            const timeIn = new Date("1540-1-1 12:00 AM").getTime()
            const timeOut = new Date("1540-1-1 12:15 AM").getTime()
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