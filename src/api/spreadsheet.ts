// import type GoogleSpreadsheetWorksheet from 'google-spreadsheet/lib/GoogleSpreadsheetWorksheet';
import { GoogleSpreadsheet, GoogleSpreadsheetWorksheet, GoogleSpreadsheetRow } from "google-spreadsheet";
import { loggedinSheetName, logSheetName, certsSheetName, avatarsSheetName, certNamesSheetName } from '../consts';
import google_client_secret from "../../secrets/client_secret.json"
import type { Certification, FailedEntry, LoggedIn, SpreadsheetMemberInfo } from '../types';
import { E_CANCELED, Mutex } from 'async-mutex'
import { hours_spreadsheet_id } from '../../secrets/consts';
import { getMembers } from '../member-collector/collector';

let googleDriveAuthed = false
const authMutex = new Mutex()

let timesheet: GoogleSpreadsheetWorksheet
let loggedinSheet: GoogleSpreadsheetWorksheet
let avatarsSheet: GoogleSpreadsheetWorksheet
let certsSheet: GoogleSpreadsheetWorksheet
let certNamesSheet: GoogleSpreadsheetWorksheet

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
        if(googleDriveAuthed) {return}
        doc = doc ?? await getSpreadsheet()
        timesheet = doc.sheetsByTitle[logSheetName]
        loggedinSheet = doc.sheetsByTitle[loggedinSheetName]
        avatarsSheet = doc.sheetsByTitle[avatarsSheetName]
        certsSheet = doc.sheetsByTitle[certsSheetName]
        certNamesSheet = doc.sheetsByTitle[certNamesSheetName]
        googleDriveAuthed = true
    })
    return [timesheet, loggedinSheet, certsSheet]
}

async function ensureAuthed() {
    if(googleDriveAuthed) {return}
    await configureDrive()
}

export async function getCertifications():Promise<{[key: string]:Certification}> {
    await ensureAuthed();

    await certNamesSheet.loadCells()
    const rows:GoogleSpreadsheetRow[] = await certNamesSheet.getRows()
    const output:{[key: string]:Certification} = {}
    rows.forEach((row) => {
        output[row.ID] = {
            id:row.ID,
            name:row.Name
        }
    })
    return output
}

// get member names from NAMED RANGE "MemberNames"
export async function getMemberInfo():Promise<SpreadsheetMemberInfo[]> {
    await ensureAuthed()
    
    await certsSheet.loadCells()
    const rows:GoogleSpreadsheetRow[] = await certsSheet.getRows()
    
    const members:SpreadsheetMemberInfo[] = []
    rows.forEach(row=>{
        if (row.Name == "") return;
        
        const certs:string[] = row.CertIds.length > 0 ? row.CertIds.split(",") : []
        members.push({
            name: row.Name,
            goodPhoto: row.Photo == "TRUE",
            certs: certs
        })
    })
    return members
}

export async function addHours(name: string, timeIn: number, timeOut: number, activity: string) {
    await ensureAuthed()
    
    timeOut = timeOut ?? Date.now();
    const timeInSec = timeIn / 1000
    const timeOutSec = timeOut / 1000
    // Calculate duration
    const hours = (timeOut - timeIn) / 3600000
    // Don't log time less than 0.01 hours
    if (hours < 0.05) { console.debug("Too few hours:", name, timeIn, timeOut, activity, hours); return }
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
            await loggedinSheet.loadCells()
            await loggedinSheet.resize({ rowCount: 1, columnCount: 2 }) // clear rows
            if (rows.length > 0) {
                await loggedinSheet.addRows(rows)
            } else {
                await loggedinSheet.resize({ rowCount: 2, columnCount: 2 }) // so that the loggedin checkboxes reset
            }
            await loggedinSheet.saveUpdatedCells()
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
            await avatarsSheet.loadCells()
            await avatarsSheet.resize({ rowCount: 1, columnCount: 2 })
            if (rows.length > 0) {
                await avatarsSheet.addRows(rows)
            }
            await avatarsSheet.saveUpdatedCells()
        })
    } catch (e) {
        // If the update was canceled, ignore the error
        if (e !== E_CANCELED) {
            console.info(e)
            throw e
        }
    }
}