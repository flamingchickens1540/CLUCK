import type { Member } from '@slack/web-api/dist/response/UsersListResponse';
import type { FailedEntry, LoggedIn } from '../types';

import { WebClient, WebClientEvent } from "@slack/web-api";
import bodyParser from 'body-parser';
import cors from 'cors';
import { CronJob } from 'cron';
import { Router } from 'express';
import fs from 'fs';
import { slack_token, cluck_api_keys } from '../../secrets/consts';
import { failedFilePath, loggedInFilePath } from '../consts';
import { logMember, saveMemberLog } from "./memberlog";
import { addHoursSafe, configureDrive, updateLoggedIn } from "./spreadsheet";



let memberlist: Member[];
export const client: WebClient = new WebClient(slack_token);

client.on(WebClientEvent.RATE_LIMITED, (numSeconds) => {
    console.debug(`A rate-limiting error occurred and the app is going to retry in ${numSeconds} seconds.`);
});

let loggedIn: LoggedIn = {};
if (fs.existsSync(loggedInFilePath)) { loggedIn = JSON.parse(fs.readFileSync(loggedInFilePath, "utf-8")) }

let failed: FailedEntry[] = [];
if (fs.existsSync(failedFilePath)) { failed = JSON.parse(fs.readFileSync(failedFilePath, "utf-8")) }

configureDrive();

function decodeAuth(apiKey:string) {
    if (apiKey == null) {
        return [null, null];
    }
    const id = Buffer.from(apiKey.split(":")[0], 'base64').toString('ascii');
    const key = Buffer.from(apiKey.split(":")[1], 'base64').toString('ascii');
    return [id, key];
}
function isValidAuth(apiKey:string):boolean {
    const [id, key] = decodeAuth(apiKey);
    if (id == null || key == null) {return false}
    if (cluck_api_keys[id] == key) { return true }
    return false;
}

// Setup API Routes
export const router = Router();
router.use(cors());
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());
router.use((req, res, next) => {
    if (req.method != "GET") {
        const body = Object.fromEntries(Object.entries(req.body));
        let authString = "none";
        if(body["api_key"] != null) {
            body["api_key"] = isValidAuth(req.body.api_key) ? "VALID_API_KEY" : "INVALID_API_KEY";
            authString = decodeAuth(req.body.api_key)[0];
        }
        console.log(req.method, req.url, "("+authString+")", "["+new Date().toLocaleString()+"]", JSON.stringify(body));
    }
    next();
})

refreshSlackMemberlist();
// INIT API ROUTES
router.post('/clock', (req, res) => {
    
    // Get and check args
    const { name, loggingin, api_key: apiKey} = req.body;
    // Authenticate
    if(!isValidAuth(apiKey)) {res.status(401).send('Bad Cluck API Key').end(); return; }
    if (typeof name === 'undefined' || typeof loggingin === 'undefined') { res.status(400).send('Must include name string and loggingin boolean in URL query').end(); return; }
    
    if (loggingin) {
        // Log In
        if (!loggedIn[name]) { loggedIn[name] = Date.now() }
        res.end();
        logMember(name, true, loggedIn);
    } else {
        // Log Out
        if (loggedIn[name]) { // Test to make sure person is logged in
            res.status(202).end();
            console.log(`Logging out ${name}`);
            addHoursSafe(name, failed, loggedIn[name]);
            delete loggedIn[name];
            logMember(name, false, loggedIn);
        } else { res.end() }
    }
})

router.post('/log', (req, res) => {
    // Authenticate
    if(!isValidAuth(req.body.api_key)) {res.status(401).send('Bad Cluck API Key').end(); return; }
   
    // Get and check args
    const name = req.body.name; // User name to add hours to
    const hours = parseFloat(req.body.hours); // Time to add in hours
    const activity = req.body.activity; // Activity
 
    // Check for existing request arguments
    if (!name) { res.status(400).send('Must include name in body').end(); return; }
    if (!hours) { res.status(400).send('Must include hours in body').end(); return; }
    if (isNaN(hours)) { res.status(400).send('Must include hours as number in body').end(); return; }
    if (!activity) { res.status(400).send('Must include activity in body').end(); return; }
    
    
    const timeOut = Date.now();
    const timeIn = timeOut - (hours * 60 * 60 * 1000);
    
    res.end();
    // Convert hours to time in and out        
    addHoursSafe(name, failed, timeIn, timeOut, activity);
})

router.post("/auth", (req, res) => {
    if(isValidAuth(req.body.api_key)) {
        res.status(200).send("Authentication successful");
    } else {
        res.status(401).send("Invalid CLUCK API Key");
    }
})

router.get('/loggedin', (req, res) => {
    res.send(loggedIn);
    res.end();
})

router.get('/ping', (req, res) => {
    res.status(200);
    res.send("pong");
})

router.post('/void', (req, res) => {
    if(!isValidAuth(req.body.api_key)) {res.status(401).send('Bad Cluck API Key').end(); return; }
    if (!req.body.name) { res.status(400).send('Must include name in body').end(); return; }
    if (Object.keys(loggedIn).includes(req.body.name)) {
        delete loggedIn[req.body.name];
        res.status(200).send('Logged out').end();
        updateLoggedIn(loggedIn);
    } else {
        res.status(422).send('User not logged in').end();
    }
    res.end();
})


export async function sendSlackMessage(fullname: string, text: string) {
    if (client == null) {
        console.warn("Slack Client not loaded yet");
        return;
    }
    if (memberlist == null) {
        await refreshSlackMemberlist();
    }
    const user = memberlist.find(userobj => userobj.real_name?.toLowerCase().includes(fullname.toLowerCase()) ?? false);
    if (user == null || user.id == null) { throw Error("Could not send message to " + fullname) }
    console.log(`Sending message to ${user.name} (${user.id})`);
    return await client.chat.postMessage({ channel: user.id, text: text });
    
}

export async function refreshSlackMemberlist() {
    console.log("Refreshing slack members");
    const users = await client.users.list();
    if (users.members == null) { console.warn("Could not load memberlist"); return; }
    memberlist = users.members
}
// Periodically save
const cronSave = () => {
    try {
        fs.writeFileSync(loggedInFilePath, JSON.stringify(loggedIn, null, 4));
        fs.writeFileSync(failedFilePath, JSON.stringify(failed, null, 4));
        saveMemberLog();
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
    failed = [];
    for (const failedEntry of failedCache) {
        console.log(`attempting to log ${failedEntry.timeIn} to ${failedEntry.timeOut} hours for ${failedEntry.name} for ${failedEntry.activity}`);
        await addHoursSafe(failedEntry.name, failed, failedEntry.timeIn, failedEntry.timeOut, failedEntry.activity);
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
    const messageUsers = Object.keys(loggedIn);
    loggedIn = {};
    console.log('Logging out users');
    updateLoggedIn(loggedIn)
    messageUsers.forEach(async (memberName) => {
        try {
            await sendSlackMessage(memberName, `Hey ${memberName.split(' ')[0]}! You signed into the lab today but forgot to sign out, so we didnt log your hours for today :( Make sure you always sign out before you leave. Hope you had fun and excited to see you in the lab again!`);
        } catch (error) {
            console.error(error);
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
    failed = newValue ?? failed;
    return failed;
}
export function accessLoggedIn(newValue?:LoggedIn) { 
    loggedIn = newValue ?? loggedIn;
    return loggedIn;
}