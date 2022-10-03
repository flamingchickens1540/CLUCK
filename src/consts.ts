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

const cluckBaseurl = new URL(basepath, baseorigin).href
const cluckApiUrl = new URL("/api/", cluckBaseurl+"/").href

export function getApiEndpoint(endpoint, absolute = false) {
    endpoint = endpoint.replace(/^\//, "")
    const url = new URL(endpoint, cluckApiUrl)
    return absolute ? url.href : url.pathname 
}
export function getResourceURL(resource, absolute=false) {
    resource = resource.replace(/^\//, "")
    const url = new URL(resource, cluckBaseurl)
    return absolute ? url.href : url.pathname 
}
