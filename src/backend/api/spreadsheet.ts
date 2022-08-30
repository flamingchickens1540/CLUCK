import type GoogleSpreadsheetWorksheet from 'google-spreadsheet/lib/GoogleSpreadsheetWorksheet';
import { GoogleSpreadsheet } from "google-spreadsheet";
import { hours_spreadsheet_id, loggedin_sheet_name, log_sheet_name } from './consts';
import google_client_secret from "../../../secrets/client_secret.json"
import type { FailedEntry, LoggedIn } from '.';

let google_drive_authed:boolean = false
let timesheet:GoogleSpreadsheetWorksheet
let loggedin_sheet:GoogleSpreadsheetWorksheet


export async function getSpreadsheet() {
    const doc = await new GoogleSpreadsheet(hours_spreadsheet_id)
    await doc.useServiceAccountAuth(google_client_secret)
    await doc.loadInfo()
    return doc
}
export async function configureDrive(doc?:GoogleSpreadsheet) {
    doc = doc ?? await getSpreadsheet()
    timesheet = doc.sheetsByTitle[log_sheet_name]
    loggedin_sheet = doc.sheetsByTitle[loggedin_sheet_name]
    google_drive_authed = true
    return [timesheet, loggedin_sheet]
}


export async function addLabHours(name:string, timeIn:number, timeOut?:number) {
    if (!google_drive_authed) { 
        throw Error("Google drive not authed")
    }
    
    if (timeOut == null) timeOut = Date.now();
    
    // Calculate duration
    let hours = (timeOut - timeIn) / 3600000
    // Don't log time less than 0.01 hours
    if (hours < 0.01) { return }
    // Round to nearest hundredth
    let hoursRounded = hours.toFixed(2)
    
    // Add to sheet
    await timesheet.loadCells()
    await timesheet.addRow([timeIn/1000, timeOut/1000, name, hoursRounded, 'lab'])
    await timesheet.saveUpdatedCells()
}

export async function addLabHoursSafe(name:string, failed:FailedEntry[], timeIn:number, timeOut?:number) {
    try {
        await addLabHours(name, timeIn, timeOut)
    } catch (e) {
        timeOut = timeOut ?? Date.now()
        failed.push({ name, timeIn, timeOut})
        console.error(`failed hours add operation: ${name} : ${timeIn}, ${timeOut}`)
        console.error(e)
    }
}

export async function updateLoggedIn(loggedIn:LoggedIn) {
    if (!google_drive_authed) { 
        throw Error("Google drive not authed")
    }
    await loggedin_sheet.loadCells()
    await loggedin_sheet.resize({ rowCount: 1, columnCount: 2 })
    let rows = Object.entries(loggedIn).map(entry => {
        let date = new Date(entry[1]).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})
        return [entry[0], date]
    })
    if (rows.length > 0) {
        await loggedin_sheet.addRows(rows)
    }
    
    await loggedin_sheet.saveUpdatedCells()
}

