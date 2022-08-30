import fs from 'fs'
import { LoggedIn } from '.'
import { logPath } from './consts';
import { updateLoggedIn } from './spreadsheet'


type MemberLogEntry = {
    name: string;
    loggingin: boolean;
    time: number;
}
let memberlog:MemberLogEntry[] = []

export async function logMember(name:string, loggingin:boolean, logged_in:LoggedIn) {
    try {
        await updateLoggedIn(logged_in)
    } catch (e) {
        console.error(e)
    }
    memberlog.push({ name, loggingin, time: Date.now()})
}

export function saveMemberLog() {
    // Use jsonl to avoid having to load the entire file into memory
    memberlog.forEach(item => {
        fs.appendFileSync(logPath, JSON.stringify(item))
    })
    setMemberlog([])
}

export function getMemberlog() {return memberlog}
export function setMemberlog(new_log) {memberlog = new_log}