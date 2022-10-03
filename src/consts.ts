import { basepath, baseorigin } from "../secrets/consts";

// Spreadsheet
export const logSheetName = "Log"
export const loggedinSheetName = "Logged In"
export const avatarsSheetName = "Avatars"
export const certsSheetName = "Certs"
export const certNamesSheetName = "Cert Names"
export const namesRangeName = "MemberNames"

// Web server


// data files
export const dataDirectory = './data';
export const memberLogFilePath  = dataDirectory+'/memberlog.jsonl'
export const memberListFilePath = dataDirectory+'/members.json'
export const loggedInFilePath   = dataDirectory+'/loggedin.json'
export const failedFilePath     = dataDirectory+'/failed.json'
export const photosFilePath     = dataDirectory+'/photos.json'

export const baseurl = `${baseorigin}${basepath}`
export const cluckBaseurl = baseurl.replace(/\/+$/, "")
export const cluckBasepath = ("/"+basepath).replace(/\/+/g, '/').replace(/\/+$/, "")
export const cluckApiUrl = ("/"+basepath+"/api").replace(/\/+/g, '/').replace(/\/+$/, "")