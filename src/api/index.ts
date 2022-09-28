import type { Member } from '@slack/web-api/dist/response/UsersListResponse'
import type { FailedEntry, LoggedIn } from '../types'

import { WebClient } from "@slack/web-api"
import bodyParser from 'body-parser'
import cors from 'cors'
import { CronJob } from 'cron'
import { Router } from 'express'
import fs from 'fs'
import { slack_token, cluck_api_key } from '../../secrets/consts'
import { failedFilePath, loggedInFilePath } from '../consts'
import { logMember, saveMemberLog } from "./memberlog"
import { addHoursSafe, configureDrive, updateLoggedIn } from "./spreadsheet"



let memberlist: Member[]
export const client: WebClient = new WebClient(slack_token)

let loggedIn: LoggedIn = {}
if (fs.existsSync(loggedInFilePath)) { loggedIn = JSON.parse(fs.readFileSync(loggedInFilePath, "utf-8")) }

let failed: FailedEntry[] = []
if (fs.existsSync(failedFilePath)) { failed = JSON.parse(fs.readFileSync(failedFilePath, "utf-8")) }




configureDrive()



// Setup API Routes
export const router = Router()
router.use(cors())
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());
router.use((req, res, next) => {
    if (!["/ping", "/loggedin"].includes(req.url)) {
        let body:string = JSON.stringify(req.body)
        body = body.replace(cluck_api_key, "VALID_API_KEY")
        console.log(req.method, req.url, body)
    }
    next()
})

refreshSlackMemberlist()
// INIT API ROUTES
router.post('/clock', (req, res) => {
    
    // Get and check args
    const { name, loggingin, api_key} = req.body
    // Authenticate
    if(api_key != cluck_api_key) {res.status(401).send('Bad Cluck API Key').end(); return; }
    if (typeof name === 'undefined' || typeof loggingin === 'undefined') { res.status(400).send('Must include name string and loggingin boolean in URL query').end(); return; }
    
    if (loggingin) {
        // Log In
        if (!loggedIn[name]) { loggedIn[name] = Date.now() }
        res.end()
        logMember(name, true, loggedIn)
    } else {
        // Log Out
        if (loggedIn[name]) { // Test to make sure person is logged in
            res.status(202).end()
            console.log(`Logging out ${name}`)
            addHoursSafe(name, failed, loggedIn[name])
            delete loggedIn[name]
            logMember(name, false, loggedIn)
        } else { res.end() }
    }
})

router.post('/log', (req, res) => {
    // Authenticate
    if(req.body.api_key != cluck_api_key) {res.status(401).send('Bad Cluck API Key').end(); return; }
   
    // Get and check args
    const name = req.body.name // User name to add hours to
    const hours = parseFloat(req.body.hours) // Time to add in hours
    const activity = req.body.activity // Activity
 
    // Check for existing request arguments
    if (!name) { res.status(400).send('Must include name in body').end(); return; }
    if (!hours) { res.status(400).send('Must include hours in body').end(); return; }
    if (isNaN(hours)) { res.status(400).send('Must include hours as number in body').end(); return; }
    if (!activity) { res.status(400).send('Must include activity in body').end(); return; }
    
    
    const time_out = Date.now()
    const time_in = time_out - (hours * 60 * 60 * 1000)
    
    res.end()
    // Convert hours to time in and out        
    addHoursSafe(name, failed, time_in, time_out, activity)
})

router.post("/auth", (req, res) => {
    if (req.body.api_key == cluck_api_key) { 
        res.status(200).send("Authenticated").end()
    } else {
        res.status(401).send("Invalid CLUCK API Key").end()
    }
    
})

router.get('/loggedin', (req, res) => {
    res.send(loggedIn)
    res.end()
})

router.get('/ping', (req, res) => {
    res.status(200);
    res.send("pong");
})

router.post('/void', (req, res) => {
    if(req.body.api_key != cluck_api_key) {res.status(401).send('Bad Cluck API Key').end(); return; }
    if (!req.body.name) { res.status(400).send('Must include name in body').end(); return; }
    if (Object.keys(loggedIn).includes(req.body.name)) {
        delete loggedIn[req.body.name]
        res.status(200).send('Logged out').end()
        updateLoggedIn(loggedIn)
    } else {
        res.status(422).send('User not logged in').end()
    }
    res.end();
})


export async function sendSlackMessage(fullname: string, text: string) {
    if (client == null) {
        console.warn("Slack Client not loaded yet")
        return
    }
    if (memberlist == null) {
        await refreshSlackMemberlist()
    }
    const user = memberlist.find(userobj => userobj.real_name?.toLowerCase().includes(fullname.toLowerCase()) ?? false)
    if (user == null || user.id == null) { throw Error("Could not send message to " + fullname) }
    console.log(`Sending message to ${user.name} (${user.id})`)
    return await client.chat.postMessage({ channel: user.id, text: text })
    
}

export async function refreshSlackMemberlist() {
    const users = await client.users.list()
    if (users.members == null) { console.warn("Could not load memberlist"); return}
    memberlist = users.members
}
// Periodically save
const cronSave = () => {
    try {
        fs.writeFileSync(loggedInFilePath, JSON.stringify(loggedIn, null, 4))
        fs.writeFileSync(failedFilePath, JSON.stringify(failed, null, 4))
        saveMemberLog()
    } catch (error) { console.log(error) }
}

new CronJob({
    cronTime: '*/5 * * * * *',
    start: true,
    timeZone: 'America/Los_Angeles',
    runOnInit: false,
    onTick: cronSave
})

// Periodically retry failed requests every 15 minutes and on startup
const cronRetryFailed = async () => {
    const failedCache = failed;
    failed = []
    for (const failedEntry of failedCache) {
        console.log(`attempting to log ${failedEntry.timeIn} to ${failedEntry.timeOut} hours for ${failedEntry.name} for ${failedEntry.activity}`)
        await addHoursSafe(failedEntry.name, failed, failedEntry.timeIn, failedEntry.timeOut, failedEntry.activity)
    }
}
new CronJob({
    cronTime: '*/15 * * * *',
    start: true,
    timeZone: 'America/Los_Angeles',
    runOnInit: true,
    onTick: cronRetryFailed
})

// sign out at midnight
const cronSignout = () => {
    const messageUsers = Object.keys(loggedIn)
    loggedIn = {}
    console.log('Logging out users')
    updateLoggedIn(loggedIn)
    messageUsers.forEach(async (memberName) => {
        try {
            await sendSlackMessage(memberName, `Hey ${memberName.split(' ')[0]}! You signed into the lab today but forgot to sign out, so we didnt log your hours for today :( Make sure you always sign out before you leave. Hope you had fun and excited to see you in the lab again!`)
        } catch (error) {
            console.error(error)
        }
    })
    
}
new CronJob({
    cronTime: '0 0 * * *',
    start: true,
    timeZone: 'America/Los_Angeles',
    runOnInit: false,
    onTick: cronSignout
})

// refresh memberlist every day
new CronJob({
    cronTime: '0 0 * * *',
    start: true,
    timeZone: 'America/Los_Angeles',
    runOnInit: false,
    onTick: refreshSlackMemberlist
})

export const cronJobs = {
    "save":cronSave,
    "retryFailed":cronRetryFailed,
    "signout":cronSignout
}

export function accessFailed(newValue?:FailedEntry[]) { 
    failed = newValue ?? failed
    return failed 
}
export function accessLoggedIn(newValue?:LoggedIn) { 
    loggedIn = newValue ?? loggedIn
    return loggedIn 
}