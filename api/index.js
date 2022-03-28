
function sleep(milis) { return new Promise(res => setTimeout(res, milis)) }

import { GoogleSpreadsheet } from "google-spreadsheet";
import { max_row, name_column, lab_hours_column, hours_sheet_id, min_row } from './consts.js'
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
    function slackTo(fullname, text) {
        let user = memberlist.find(userobj => userobj.profile['real_name'].toLowerCase().includes(fullname.toLowerCase()))
        if (!user) { return; }
        return client.chat.postMessage({ channel: user.id, text: text })
    }

    //// INIT SPREADSHEET
    const doc = await new GoogleSpreadsheet(hours_sheet_id)
    await doc.useServiceAccountAuth(google_client_secret)
    await doc.loadInfo()
    let sheet = doc.sheetsByIndex[0]
    async function addLabHours(name, hours) {
        let hoursRounded = parseFloat(hours).toFixed(1);
        if (hoursRounded == 0) { return }
        await sheet.loadCells({ startRowIndex: 0, endRowIndex: max_row + 1, startColumnIndex: name_column, endColumnIndex: lab_hours_column + 1 })
        for (let y = min_row; y < max_row; y++) {
            const name_cell = sheet.getCell(y, name_column)
            if (name_cell.value && name_cell.value != "" && name_cell.value != " " && name.toLowerCase().includes(name_cell.value.toLowerCase())) {
                const hours_cell = sheet.getCell(y, lab_hours_column)
                let preformula = hours_cell.formula
                if ('d' + preformula == 'dnull') {
                    if (hours_cell.value) {
                        preformula = `=${hours_cell.value}`
                    } else {
                        preformula = `=0`
                    }
                }
                hours_cell.formula = `${preformula}+${hoursRounded}`
                hours_cell.save()
                return
            }

        }
    }
    async function addLabHoursSafe(name, hours) {
        try {
            await addLabHours(name, hours)
        } catch (e) {
            failed.push({ name, hours })
            console.log(`failed hours add opperation: ${name} : ${hours}`)
        }
    }


    app.get('/clock/', (req, res) => {
        // Get and check args
        let name = req.query.name
        let loggingin = req.query.loggingin
        console.log(loggingin)
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
                addLabHoursSafe(name, (Date.now() - loggedIn[name]) / 3600000)
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

    // Start server
    // NOPE

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
        memberlog.push({ name, loggingin, time: Date.now() })
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

    // Periodically retry failed requests EVERY HOUR
    (async () => {
        while (true) {
            // await sleep(1000)
            await sleep(60 * 60 * 1000)
            const failedCache = failed;
            failed = []
            for (let failedLog of failedCache) {
                console.log(`attempting to readd ${failedLog.hours} hours to ${failedLog.name}`)
                await addLabHoursSafe(failedLog.name, failedLog.hours)
            }
        }
    })();

    // Cron sign out at midnight
    const cronjob = new CronJob('0 0 0 * * *', () => {
        let messageUsers = Object.keys(loggedIn)
        loggedIn = {}
        console.log('hiiii')
        messageUsers.forEach(memberName => {
            console.log(memberName)
            slackTo(memberName, `Hey ${memberName.split(' ')[0]}! You signed into the lab today but forgot to sign out, so we didnt log your hours for today :( Make sure you always sign out before you leave. Hope you had fun and excited to see you in the lab again!`)
        })
    }, null, true, 'America/Los_Angeles')
    cronjob.start()

    return app;
}