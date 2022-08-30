import { beforeAll, describe, expect, jest, test } from '@jest/globals';
import type { GoogleSpreadsheetWorksheet } from 'google-spreadsheet';
import type { SpyInstance } from 'jest-mock';
import type { FailedEntry, LoggedIn } from '.';
import { loggedin_sheet_name, log_sheet_name } from '../../consts';
import { addLabHours, addLabHoursSafe, configureDrive, getSpreadsheet, updateLoggedIn } from './spreadsheet';



let doc
beforeAll(async () => {
    doc = await getSpreadsheet()
})

describe('Timeclock Interface', () => {
    let timesheet: GoogleSpreadsheetWorksheet
    let loggedin_sheet: GoogleSpreadsheetWorksheet
    let addRowSpy: SpyInstance

    describe('Unauthenticated', () => {
        test('addLabHours should throw error if not authed', async () => {
            await expect(addLabHours('Test Chicken', 0, 0)).rejects.toThrow('Google drive not authed')
        })
        test('updateLoggedIn should throw error if not authed', async () => {
            await expect(updateLoggedIn({})).rejects.toThrow('Google drive not authed')
        })
    })
    describe('Authenticated', () => {
        beforeAll(async () => {
            [timesheet, loggedin_sheet] = (await configureDrive(doc))
            addRowSpy = jest.spyOn(timesheet, 'addRow').mockImplementation(() => Promise.resolve())

            // Override spreadsheet modification functions for speed, not used in tests
            jest.spyOn(timesheet, 'loadCells').mockImplementation(() => Promise.resolve())
            jest.spyOn(timesheet, 'saveUpdatedCells').mockImplementation(() => Promise.resolve())
        })

        describe('addLabHours', () => {
            test('should add row with correct values', async () => {
                // Create dates with a duration of 0.25 hours
                const timeIn = new Date("1540-1-1 1:00 PM").getTime()
                const timeOut = new Date("1540-1-1 1:15 PM").getTime()
                await addLabHours("Test Chicken", timeIn, timeOut)
                expect(addRowSpy).toBeCalledTimes(1)
                expect(addRowSpy).toBeCalledWith([timeIn/1000, timeOut/1000, "Test Chicken", "0.25", "lab"])
            })
            
            test('should only add time greater than 0.01 hours', async () => {
                // Create dates with a duration of less than 0.01 hours (36 seconds)
                const timeIn = new Date("1540-1-1 1:00 PM").getTime()
                const timeOut = new Date("1540-1-1 1:00:35 PM").getTime()
                await addLabHours("Test Chicken", timeIn, timeOut)
                expect(addRowSpy).toBeCalledTimes(0)
            })

            test('should not add negative time', async () => {
                // Create dates with a negative duration
                const timeIn = new Date("1540-1-1 1:15 PM").getTime()
                const timeOut = new Date("1540-1-1 1:00 PM").getTime()
                await addLabHours("Test Chicken", timeIn, timeOut)
                expect(addRowSpy).toBeCalledTimes(0)
            })
        })

        describe('addLabHoursSafe', () => {
            test('should have added row with correct values ', async () => {
                const failedEntries: FailedEntry[] = []
                // Create dates with a duration of 0.25 hours
                const timeIn = new Date("1540-1-1 1:00 PM").getTime()
                const timeOut = new Date("1540-1-1 1:15 PM").getTime()
                
                await addLabHoursSafe("Test Chicken", failedEntries, timeIn, timeOut)
                // Confirm that the rows were added
                expect(addRowSpy).toBeCalledTimes(1)
                expect(addRowSpy).toBeCalledWith([timeIn/1000, timeOut/1000, "Test Chicken", "0.25", "lab"])
                // Ensure that it did not mark the entry as failed
                expect(failedEntries.length).toEqual(0)
            })

            test('should save failed entries', async () => {
                // Prevent errors from being printed to console
                jest.spyOn(global.console, 'error').mockImplementation(() => { });
                // Force an error
                jest.spyOn(timesheet, 'addRow').mockImplementation(() => { throw Error("Test Error") })

                // Create dates, values shouldn't matter
                const timeIn = new Date("1540-1-1 1:00 PM").getTime()
                const timeOut = new Date("1540-1-1 1:15 PM").getTime()

                let failedEntries: FailedEntry[] = []
                await addLabHoursSafe("Test Chicken", failedEntries, timeIn, timeOut)

                // Confirm that it marked the entry as failed
                expect(failedEntries.length).toEqual(1)
                expect(failedEntries).toMatchObject([{
                    name: "Test Chicken",
                    timeIn: timeIn,
                    timeOut: timeOut,
                }])
            })
        })

        describe('updateLoggedIn', () => {
            let resizeSpy: SpyInstance
            let addRowsSpy: SpyInstance
            
            beforeAll(() => {
                resizeSpy = jest.spyOn(loggedin_sheet, 'resize').mockImplementation(() => Promise.resolve())
                addRowsSpy = jest.spyOn(loggedin_sheet, 'addRows').mockImplementation(() => Promise.resolve()) as unknown as SpyInstance
            })

            test('should add rows', async () => {
                let logged_in: LoggedIn = { "Test Chicken": new Date("1540-01-01 12:00 AM").getTime() }
                await updateLoggedIn(logged_in)
                expect(resizeSpy).toBeCalledTimes(1)
                expect(addRowsSpy).toBeCalledTimes(1)
            })

            test('should not add rows without logged in members', async () => {
                let logged_in: LoggedIn = {}
                await updateLoggedIn(logged_in)
                expect(resizeSpy).toBeCalledTimes(1)
                expect(addRowsSpy).toBeCalledTimes(0)
            })

            describe('time formatting', () => {
                test('should properly format 12:00 AM', async () => {
                    let logged_in: LoggedIn = { "Test Chicken": new Date("1540-01-01 12:00 AM").getTime() }
                    await updateLoggedIn(logged_in)
                    expect(addRowsSpy).toBeCalledWith([["Test Chicken", "12:00 AM"]])
                })

                test('should properly format 12:00 PM', async () => {
                    let logged_in: LoggedIn = { "Test Chicken": new Date("1540-01-01 12:00 PM").getTime() }
                    await updateLoggedIn(logged_in)
                    expect(addRowsSpy).toBeCalledWith([["Test Chicken", "12:00 PM"]])
                })

                test('should properly format 3:40 PM', async () => {
                    let logged_in: LoggedIn = { "Test Chicken": new Date("1540-01-01 3:40 PM").getTime() }
                    await updateLoggedIn(logged_in)
                    expect(addRowsSpy).toBeCalledWith([["Test Chicken", "3:40 PM"]])
                })
            })
        })
    })
})

describe('Google Spreadsheet Structure', () => {
    describe('Log sheet', () => {
        test('should have log sheet', () => {
            expect(doc.sheetsByTitle[log_sheet_name]).toBeDefined()
        })

        test('log sheet should have correct columns', async () => {
            const sheet = doc.sheetsByTitle[log_sheet_name]
            expect(sheet.columnCount).toEqual(5)
            await sheet.getRows()
            expect(sheet.headerValues).toEqual(['In', 'Out', 'Name', 'Hours', 'Type'])
        })
    })

    describe('LoggedIn sheet', () => {
        test('should have loggedin sheet', () => {
            expect(doc.sheetsByTitle[loggedin_sheet_name]).toBeDefined()
        })

        test('loggedin sheet should have correct columns', async () => {
            const sheet = doc.sheetsByTitle[loggedin_sheet_name]
            expect(sheet.columnCount).toEqual(2)
        })
    })

})
