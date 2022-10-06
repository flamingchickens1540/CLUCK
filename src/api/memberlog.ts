import fs from 'fs'
import { LoggedIn } from '../types'
import { memberLogFilePath } from '../consts';
import { updateLoggedIn } from './spreadsheet'


type MemberLogEntry = {
    name: string;
    loggingin: boolean;
    time: number;
}
let memberlog:MemberLogEntry[] = []

export async function logMember(name:string, loggingIn:boolean, loggedIn:LoggedIn) {
    try {
        await updateLoggedIn(loggedIn)
    } catch (e) {
        console.error(e)
    }
    memberlog.push({ name, loggingin: loggingIn, time: Date.now()})
}

export function saveMemberLog() {
    // Use jsonl to avoid having to load the entire file into memory
    memberlog.forEach(item => {
        fs.appendFileSync(memberLogFilePath, JSON.stringify(item)+"\n")
    })
    setMemberlog([])
}

export function getMemberlog() {return memberlog}
export function setMemberlog(log) {memberlog = log}