
function sleep(milis) { return new Promise(res => setTimeout(res, milis)) }

import { GoogleSpreadsheet } from "google-spreadsheet";
import { hours_spreadsheet_id, log_sheet_name, loggedin_sheet_name } from './consts.js'
import cors from 'cors'
import fs from 'fs'
import { CronJob } from 'cron'
import { WebClient } from "@slack/web-api"

export const setupApi = async (app,token, google_client_secret) => {
    app.use(cors())
    
    let loggedIn = {}
    if (fs.existsSync('api/loggedin.json')) { loggedIn = JSON.parse(fs.readFileSync('api/loggedin.json')) }

    let failed = []
    if (fs.existsSync('api/failed.json')) { failed = JSON.parse(fs.readFileSync('api/failed.json')) }

    // INIT SLACKBOT
    const client = new WebClient(token);
    let memberlist = (await client.users.list()).members;

    function sendSlackMessage(fullname, text) {
        let user = memberlist.find(userobj => userobj.profile['real_name'].toLowerCase().includes(fullname.toLowerCase()))
        if (!user) { return; }
        return client.chat.postMessage({ channel: user.id, text: text })
    }

    // INIT SPREADSHEET
    const doc = await new GoogleSpreadsheet(hours_spreadsheet_id)
    await doc.useServiceAccountAuth(google_client_secret)
    await doc.loadInfo()
    let timesheet = doc.sheetsByTitle[log_sheet_name]
    let loggedin_sheet = doc.sheetsByTitle[loggedin_sheet_name]
    async function addLabHours(name, timeIn, timeOut) {
        if (typeof(timeOut)==='undefined') timeOut = Date.now();
        
        // Calculate duration
        let hours = (timeOut - timeIn) / 3600000
        let hoursRounded = parseFloat(hours).toFixed(2);
        if (hoursRounded == 0) { return }

        // Add to sheet
        await timesheet.loadCells()
        await timesheet.addRow([timeIn/1000, timeOut/1000, name, hoursRounded, 'lab'])
        await timesheet.saveUpdatedCells()
    }

    async function addLabHoursSafe(name, timeIn) {
        try {
            await addLabHours(name, timeIn)
        } catch (e) {
            let timeOut = Date.now()
            failed.push({ name, timeIn, timeOut})
            console.error(`failed hours add operation: ${name} : ${timeIn}, ${timeOut}`)
            console.error(e)
        }
    }

    async function updateLoggedIn() {
        await loggedin_sheet.loadCells()
        await loggedin_sheet.resize({ rowCount: 1, columnCount: 2 })
        let rows = Object.entries(loggedIn).map(entry => [entry[0], new Date(entry[1]).toLocaleTimeString()])
        if (rows.length > 0) {
            await loggedin_sheet.addRows(rows)
        }
        
        await loggedin_sheet.saveUpdatedCells()
    }

    // INIT API ROUTES
    app.get('/clock/', (req, res) => {
        // Get and check args
        let name = req.query.name
        let loggingin = req.query.loggingin
        // Check for existing request arguments
        if (!name || !loggingin) { res.status(400).send('Must include name string and loggingin boolean in URL query').end(); return; }

        if (loggingin === 'true') {
            // Log In
            if (!loggedIn[name]) { loggedIn[name] = Date.now() }
            res.end()
            logMember(name, true)
        } else {
            // Log Out
            if (loggedIn[name]) { // Test to make sure person is logged in
                res.end()
                addLabHoursSafe(name, loggedIn[name])
                delete loggedIn[name]
                logMember(name, false)
            } else { res.end() }
        }
    })

    app.get('/void', (req, res) => {
        delete loggedIn[req.query.name];
        res.end()
    })
    app.get('/loggedin', (req, res) => {
        res.send(loggedIn)
        res.end()
    })
    app.get('/ping', (req, res) => {
        res.status(200);
        res.send("pong");
    })

    // Read log
    const logPath = './api/memberlog.json'
    let memberlog
    if (fs.existsSync(logPath)) {
        memberlog = JSON.parse(fs.readFileSync(logPath))
        if (!Array.isArray(memberlog)) {
            memberlog = []
        }
    } else {
        memberlog = []
    }

    function logMember(name, loggingin) {
        try {
            updateLoggedIn()
        } catch (e) {
            console.error(e)
        }
        memberlog.push({ name, loggingin, time: Date.now(), row: 0 })
    }

    // Periodically save
    (async () => {
        while (true) {
            await sleep(5000)
            try {
                fs.writeFileSync('api/loggedin.json', JSON.stringify(loggedIn))
                fs.writeFileSync('api/failed.json', JSON.stringify(failed))
                fs.writeFileSync(logPath, JSON.stringify(memberlog))
            } catch (error) { console.log(error) }
        }
    })();

    // Periodically retry failed requests EVERY HOUR and on startup
    (async () => {
        while (true) {            
            const failedCache = failed;
            failed = []
            for (let failedLog of failedCache) {
                console.log(`attempting to log ${failedLog.timeIn} to ${failedLog.timeOut} hours for ${failedLog.name}`)
                await addLabHoursSafe(failedLog.name, failedLog.timeIn, failedLog.timeOut)
            }
            await sleep(60 * 60 * 1000)
        }
    })();

    // Cron sign out at midnight
    const cronjob = new CronJob('0 0 0 * * *', () => {
        let messageUsers = Object.keys(loggedIn)
        loggedIn = {}
        console.log('hiiii')
        messageUsers.forEach(memberName => {
            console.log(memberName)
            sendSlackMessage(memberName, `Hey ${memberName.split(' ')[0]}! You signed into the lab today but forgot to sign out, so we didnt log your hours for today :( Make sure you always sign out before you leave. Hope you had fun and excited to see you in the lab again!`)
        })
    }, null, true, 'America/Los_Angeles')
    cronjob.start()

    return app;
}
