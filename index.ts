const protocol = 'http';
const public_ip = 'localhost';
const server_port = 2021;

import { WebClient } from '@slack/web-api';
import express from 'express';
import { readFileSync } from 'fs';
import fetch from 'node-fetch';
import { collect } from './backend/member-collector/collector';
import { token } from './secrets/slack_secrets.js';
import { setupApi } from './backend/api/index.js';
import { CronJob } from 'cron';

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

// Setup API Routes
const slack_client = new WebClient(token)
setupApi(app, slack_client)

// Function to map sources to defined ip
function getFileProcessed(filepath) {
    let preprocessed = readFileSync(filepath).toString()
    let processed = preprocessed.replace(/\$\{\i\p\}/g, `${protocol}://${public_ip}:${server_port}`)
    return processed;
}

// Setup Webpage Routes
// NEW DASHBOARD
app.get('/dash', (req, res) => {
    res.send(getFileProcessed('./www/dash/index.html'))
    // res.sendFile('index.html', {root:'./www/Dashboard/'})
})
let delphiPost = 0;
app.get('/dash/delphi', async (req, res) => {
    delphiPost++; delphiPost %= 20; // switch to next post
    let json = await (await fetch('https://www.chiefdelphi.com/latest.json?no_definitions=true&page=0')).json() as any
    let id = json.topic_list.topics[delphiPost].id
    let link = 'https://www.chiefdelphi.com/t/' + id
    let html = await (await fetch(link)).text()
    res.send(html)
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
    res.sendFile('members.json', { root: './member-collector' })
})
app.get('/members/refresh', async (req, res) => {
    await collect(token)
    res.sendFile('members.json', { root: './member-collector' })
})
app.get('/favicon.ico', (req, res) => {
    res.sendFile('favicon.svg', { root: './www/static/img' })
})

app.get("/", (req, res) => {
    res.redirect('/dash')
})

app.listen(server_port, () => { console.log(`listening: ${server_port}`) });
