import type GoogleSpreadsheetWorksheet from 'google-spreadsheet/lib/GoogleSpreadsheetWorksheet';
import { GoogleSpreadsheet } from "google-spreadsheet";
import { loggedin_sheet_name, log_sheet_name, certs_sheet_name, names_range_name, avatars_sheet_name } from '../consts';
import google_client_secret from "../../secrets/client_secret.json"
import type { FailedEntry, LoggedIn } from '../types';
import { E_CANCELED, Mutex } from 'async-mutex'
import { hours_spreadsheet_id } from '../../secrets/consts';
import { getMembers } from '../member-collector/collector';

let google_drive_authed = false
const authMutex = new Mutex()

let timesheet: GoogleSpreadsheetWorksheet
let loggedin_sheet: GoogleSpreadsheetWorksheet
let avatars_sheet: GoogleSpreadsheetWorksheet
let certs_sheet: GoogleSpreadsheetWorksheet

const timsheetMutex = new Mutex()
const loggedInMutex = new Mutex()
const avatarsMutex = new Mutex()


export async function getSpreadsheet() {
    const doc = new GoogleSpreadsheet(hours_spreadsheet_id)
    await doc.useServiceAccountAuth(google_client_secret)
    await doc.loadInfo()
    return doc
}
// cannot run twice
export async function configureDrive(doc?: GoogleSpreadsheet) {
    if(authMutex.isLocked()) { 
        await authMutex.waitForUnlock()
        return
    }
    await authMutex.runExclusive(async () => {
        if(google_drive_authed) {return}
        doc = doc ?? await getSpreadsheet()
        timesheet = doc.sheetsByTitle[log_sheet_name]
        loggedin_sheet = doc.sheetsByTitle[loggedin_sheet_name]
        avatars_sheet = doc.sheetsByTitle[avatars_sheet_name]
        certs_sheet = doc.sheetsByTitle[certs_sheet_name]
        google_drive_authed = true
    })
    return [timesheet, loggedin_sheet, certs_sheet]
}

async function ensureAuthed() {
    if(google_drive_authed) {return}
    await configureDrive()
}

// get member names from NAMED RANGE "MemberNames"
export async function getMemberNames():Promise<string[]> {
    await ensureAuthed()
    
    await certs_sheet.loadCells(names_range_name)
    let names = await certs_sheet.getCellsInRange(names_range_name)
    
    names = names.map(name=>name[0])
    
    return names
}

export async function addHours(name: string, timeIn: number, timeOut: number, activity: string) {
    await ensureAuthed()
    
    timeOut = timeOut ?? Date.now();
    const timeInSec = timeIn / 1000
    const timeOutSec = timeOut / 1000
    // Calculate duration
    const hours = (timeOut - timeIn) / 3600000
    // Don't log time less than 0.01 hours
    if (hours < 0.01) { console.debug("Too few hours:", name, timeIn, timeOut, activity, hours); return }
    // Round to nearest hundredth
    const hoursRounded = hours.toFixed(2)
    
    // Prevent concurrent access to the spreadsheet
    await timsheetMutex.runExclusive(async () => {
        // Add to sheet
        const row = [timeInSec, timeOutSec, name, hoursRounded, activity]
        console.debug("Adding row", row)
        await timesheet.loadCells()
        await timesheet.addRow(row)
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
    await ensureAuthed()
    
    const rows = Object.entries(loggedIn).map(entry => {
        const date = new Date(entry[1]).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZone:"America/Los_Angeles"})
        return [entry[0], date]
    })
    
    // Prevent concurrent access to the spreadsheet
    loggedInMutex.cancel() // Cancel any pending updates
    try {
        await loggedInMutex.runExclusive(async () => {
            // Update sheet
            await loggedin_sheet.loadCells()
            await loggedin_sheet.resize({ rowCount: 2, columnCount: 2 })
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

export async function updateProfilePictures() {
    await ensureAuthed()
    
    const rows = getMembers().map(entry => {
        return [entry.name, entry.img]
    })
    
    // Prevent concurrent access to the spreadsheet
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