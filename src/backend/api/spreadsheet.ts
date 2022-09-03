import type GoogleSpreadsheetWorksheet from 'google-spreadsheet/lib/GoogleSpreadsheetWorksheet';
import { GoogleSpreadsheet } from "google-spreadsheet";
import { hours_spreadsheet_id, loggedin_sheet_name, log_sheet_name } from '../../consts';
import google_client_secret from "../../../secrets/client_secret.json"
import type { FailedEntry, LoggedIn } from '.';
import { E_CANCELED, Mutex } from 'async-mutex'

let google_drive_authed = false
let timesheet: GoogleSpreadsheetWorksheet
let loggedin_sheet: GoogleSpreadsheetWorksheet

const timsheetMutex = new Mutex()
const loggedInMutex = new Mutex()

export async function getSpreadsheet() {
    const doc = await new GoogleSpreadsheet(hours_spreadsheet_id)
    await doc.useServiceAccountAuth(google_client_secret)
    await doc.loadInfo()
    return doc
}
export async function configureDrive(doc?: GoogleSpreadsheet) {
    doc = doc ?? await getSpreadsheet()
    timesheet = doc.sheetsByTitle[log_sheet_name]
    loggedin_sheet = doc.sheetsByTitle[loggedin_sheet_name]
    google_drive_authed = true
    return [timesheet, loggedin_sheet]
}


export async function addLabHours(name: string, timeIn: number, timeOut?: number) {
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
        await timesheet.addRow([timeInSec, timeOutSec, name, hoursRounded, 'lab'])
        await timesheet.saveUpdatedCells()
    })
}

export async function addLabHoursSafe(name: string, failed: FailedEntry[], timeIn: number, timeOut?: number) {
    timeOut = timeOut ?? Date.now()
    try {
        await addLabHours(name, timeIn, timeOut)
    } catch (e) {
        failed.push({ name, timeIn, timeOut })
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

