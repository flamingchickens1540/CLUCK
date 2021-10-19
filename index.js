const protocol = 'http';
const public_ip = 'localhost';
const server_port = 2021;

import { collect } from './member-collector/collector.js'
import { signin_secret, token } from './secrets/slack_secrets.js'
import express from 'express'
import { readFileSync, writeFileSync } from 'fs'
const google_client_secret = JSON.parse(readFileSync('secrets/client_secret.json'))

// Refresh profile images every day // TODO: Switch to CRON job
// setInterval(collect(signin_secret,token,google_client_secret),24*60*60*1000)

// Init Express App
const app = express()

// Setup API Routes
import { setupApi } from './api/index.js'
await setupApi(app,token, google_client_secret)

// Function to map sources to defined ip
function getFileProcessed(filepath) {
    let preprocessed = readFileSync(filepath).toString()
    let processed = preprocessed.replace(/\$\{\i\p\}/g,`${protocol}://${public_ip}:${server_port}`)
    return processed;
}

// Setup Webpage Routes
// DASHBOARD
app.get('/dashboard',(req,res)=>{
    res.send(getFileProcessed('./sites/Dashboard/index.html'))
    // res.sendFile('index.html', {root:'./sites/Dashboard/'})
})
app.get('/dashboard/:resource',(req,res)=>{
    res.sendFile(req.params.resource, {root:'./sites/Dashboard/'})
})


// TOUCH LOGIN
app.get('/grid',(req,res)=>{
    res.send(getFileProcessed('./sites/TouchGrid/index.html'))
    // res.sendFile('index.html', {root:'./sites/Dashboard/'})
})
app.get('/grid/:resource',(req,res)=>{
    res.sendFile(req.params.resource, {root:'./sites/TouchGrid/'})
})
app.get('/grid/script/:resource',(req,res)=>{
    res.sendFile(req.params.resource, {root:'./sites/TouchGrid/script/'})
})

app.get('/img/:image',(req,res)=>{
    res.sendFile(req.params.image, {root:'./sites/img'})
})
app.get('/font/:font',(req,res)=>{
    res.sendFile(req.params.font, {root:'./sites/font'})
})
app.get('/members',(req,res)=>{
    res.sendFile('members.json', {root:'./member-collector'})
})
app.get('/favicon.ico',(req,res)=>{
    res.sendFile('cluckcluck!!!!!.png',{root:'./sites/img'})
})


app.listen(server_port, (err) => { console.log(`listening: ${server_port} | err: ${err !== undefined ? err : "none"}`) });
