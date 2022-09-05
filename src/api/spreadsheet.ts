import type GoogleSpreadsheetWorksheet from 'google-spreadsheet/lib/GoogleSpreadsheetWorksheet';
import { GoogleSpreadsheet } from "google-spreadsheet";
import { loggedin_sheet_name, log_sheet_name, avatars_sheet_name } from '../consts';
import google_client_secret from "../../secrets/client_secret.json"
import type { FailedEntry, LoggedIn } from '../types';
import { E_CANCELED, Mutex } from 'async-mutex'
import { hours_spreadsheet_id } from '../../secrets/consts';

let google_drive_authed = false
let timesheet: GoogleSpreadsheetWorksheet
let loggedin_sheet: GoogleSpreadsheetWorksheet
let avatars_sheet: GoogleSpreadsheetWorksheet

const timsheetMutex = new Mutex()
const loggedInMutex = new Mutex()
const avatarsMutex = new Mutex()

export async function getSpreadsheet() {
    const doc = new GoogleSpreadsheet(hours_spreadsheet_id)
    await doc.useServiceAccountAuth(google_client_secret)
    await doc.loadInfo()
    return doc
}
export async function configureDrive(doc?: GoogleSpreadsheet) {
    doc = doc ?? await getSpreadsheet()
    timesheet = doc.sheetsByTitle[log_sheet_name]
    loggedin_sheet = doc.sheetsByTitle[loggedin_sheet_name]
    avatars_sheet = doc.sheetsByTitle[avatars_sheet_name]
    google_drive_authed = true
    return [timesheet, loggedin_sheet, avatars_sheet]
}


export async function addHours(name: string, timeIn: number, timeOut: number, activity: string) {
    if (!google_drive_authed) {
        throw Error("Google drive not authed")
    }

    timeOut = timeOut ?? Date.now();
    const timeInSec = timeIn / 1000
    const timeOutSec = timeOut / 1000
    // Calculate duration
    const hours = (timeOut - timeIn) / 3600000
    // Don't log time less than 0.01 hours
    if (hours < 0.01) { return }
    // Round to nearest hundredth
    const hoursRounded = hours.toFixed(2)

    // Prevent concurrent access to the spreadsheet
    await timsheetMutex.runExclusive(async () => {
        // Add to sheet
        await timesheet.loadCells()
        await timesheet.addRow([timeInSec, timeOutSec, name, hoursRounded, activity])
        await timesheet.saveUpdatedCells()
    })
}

export async function addHoursSafe(name: string, failed: FailedEntry[], timeIn: number, timeOut?: number, activity?: string) {
    timeOut = timeOut ?? Date.now()
    activity = activity ?? 'lab'
    try {
        await addHours(name, timeIn, timeOut, activity)
    } catch (e) {
        failed.push({ name, timeIn, timeOut, activity })
        console.error(`failed hours add operation: ${name} : ${timeIn}, ${timeOut}`)
        console.error(e)
    }
}

export async function updateLoggedIn(loggedIn: LoggedIn) {
    if (!google_drive_authed) {
        throw Error("Google drive not authed")
    }

    const rows = Object.entries(loggedIn).map(entry => {
        const date = new Date(entry[1]).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
        return [entry[0], date]
    })

    // Prevent concurrent access to the spreadsheet
    loggedInMutex.cancel() // Cancel any pending updates
    try {
        await loggedInMutex.runExclusive(async () => {
            // Update sheet
            await loggedin_sheet.loadCells()
            await loggedin_sheet.resize({ rowCount: 1, columnCount: 2 })
            if (rows.length > 0) {
                await loggedin_sheet.addRows(rows)
            }
            await loggedin_sheet.saveUpdatedCells()
        })
    } catch (e) {
        // If the update was canceled, ignore the error
        if (e !== E_CANCELED) {
            console.info(e)
            throw e
        }
    }
}

export async function updateProfilePictures(members) {
    if (!google_drive_authed) {
        throw Error("Google drive not authed")
    }

    const rows = members.map(member=>[member.name,member.img])

    avatarsMutex.cancel() // Cancel any pending updates
    try {
        await avatarsMutex.runExclusive(async () => {
            // Update sheet
            await avatars_sheet.loadCells()
            await avatars_sheet.resize({ rowCount: 1, columnCount: 2 })
            if (rows.length > 0) {
                await avatars_sheet.addRows(rows)
            }
            await avatars_sheet.saveUpdatedCells()
        })
    } catch (e) {
        // If the update was canceled, ignore the error
        if (e !== E_CANCELED) {
            console.info(e)
            throw e
        }
    }

}

