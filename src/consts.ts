// Spreadsheet
export const log_sheet_name = "Log"
export const loggedin_sheet_name = "Logged In"

// Web server
export const protocol = 'http';
export const public_ip = 'localhost';
export const server_port = 2021;
export const baseurl = `${protocol}://${public_ip}:${server_port}`;

// data files
export const dataDirectory = './data';
export const memberLogFilePath  = dataDirectory+'/memberlog.jsonl'
export const memberListFilePath = dataDirectory+'/members.json'
export const loggedInFilePath   = dataDirectory+'/loggedin.json'
export const failedFilePath     = dataDirectory+'/failed.json'