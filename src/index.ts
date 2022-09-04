

import { WebClient } from '@slack/web-api';
import { CronJob } from 'cron';
import express from 'express';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import fetch from 'node-fetch';
import { token } from '../secrets/slack_secrets.js';
import { setupApi } from './backend/api/index.js';
import { collect } from './backend/member-collector/collector';
import { baseurl, dataDirectory, memberListFilePath, server_port } from './consts';

// Refresh profile images every day
new CronJob({
    cronTime: '0 0 * * *',
    start: true,
    timeZone: 'America/Los_Angeles',
    runOnInit: true,
    onTick: () => collect(token)
})

// Init Express App
const app = express()

// Init data directory
if (!existsSync(dataDirectory)) {
    mkdirSync(dataDirectory);
}

// Setup API Routes
const slack_client = new WebClient(token)


setupApi(app, slack_client)

// Function to map sources to defined ip
function getFileProcessed(filepath) {
    const preprocessed = readFileSync(filepath).toString()
    const processed = preprocessed.replace(/\$\{i\p\}/g, baseurl)
    return processed;
}

// Setup Webpage Routes
// NEW DASHBOARD
app.get(['/dash', "/"], (req, res) => {
    res.send(getFileProcessed('./www/dash/index.html'))
})
let delphiPost = 0;
app.get('/dash/delphi', async (req, res) => {
    delphiPost++; delphiPost %= 20; // switch to next post
    const json = await (await fetch('https://www.chiefdelphi.com/latest.json?no_definitions=true&page=0')).json() as any
    try {
        const id = json.topic_list.topics[delphiPost].id
        const link = 'https://www.chiefdelphi.com/t/' + id
        const html = await (await fetch(link)).text()
        res.send(html)
    } catch (e) {
        res.status(400).send('No posts found')
    }
})
app.get('/dash/:resource', (req, res) => {
    res.sendFile(req.params.resource, { root: './www/dash/' })
})
app.get('/dash/script/:resource', (req, res) => {
    res.sendFile(req.params.resource, { root: './www/dash/script/' })
})


// TOUCH LOGIN
app.get('/grid', (req, res) => {
    res.send(getFileProcessed('./www/grid/index.html'))
})
app.get('/grid/:resource', (req, res) => {
    res.sendFile(req.params.resource, { root: './www/grid/' })
})
app.get('/grid/script/:resource', (req, res) => {
    res.sendFile(req.params.resource, { root: './www/grid/script/' })
})

app.get('/static/img/:image', (req, res) => {
    res.sendFile(req.params.image, { root: './www/static/img' })
})
app.get('/static/font/:font', (req, res) => {
    res.sendFile(req.params.font, { root: './www/static/font' })
})
app.get('/members', (req, res) => {
    res.sendFile(memberListFilePath, { root: "." })
})
app.get('/members/refresh', async (req, res) => {
    await collect(token)
    res.sendFile(memberListFilePath, { root: "." })
})
app.get('/favicon.ico', (req, res) => {
    res.sendFile('favicon.svg', { root: './www/static/img' })
})

app.listen(server_port, () => { console.log(`listening: ${baseurl}`) });
