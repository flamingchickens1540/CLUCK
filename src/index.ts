

import { CronJob } from 'cron';
import express from 'express';
import { existsSync, mkdirSync } from 'fs';
import { basepath, server_port } from '../secrets/consts.js';
import { router as apiRouter } from './api/index.js';
import { dataDirectory, baseurl } from './consts';
import { collect } from './member-collector/collector';
import { router as memberRouter} from './member-collector/router';
import { router as frontendRouter } from './router';
import path from 'path'
// Refresh profile images every day
new CronJob({
    cronTime: '*/15 * * * *',
    start: true,
    timeZone: 'America/Los_Angeles',
    runOnInit: true,
    onTick: () => collect()
})


if (!existsSync(dataDirectory)) {
    mkdirSync(dataDirectory);
}

// Init Express App
const app = express()
// app.use("/", proxy("baseurl", {
//     proxyReqPathResolver: (req) => {
//         console.log(req.path)
//         console.log(url.parse(baseurl+req.url).path)
//         return url.parse(baseurl+req.url).path
//     }
// }))
app.use("/api", apiRouter)
app.use("/api", memberRouter)
app.use("/", frontendRouter)

// Init data directory



// Redirect unknown routes to dashboard
app.use(function(req, res) {
    if (!req.url.endsWith("/")) {
        const destination = path.join("/", basepath, path.normalize(req.url), "/");
        console.log("302", req.url, "->", destination)
        res.redirect(destination)
    } else {
        res.status(404).send("Could not find resource").end()
    }
})

app.listen(server_port, () => { console.log(`listening: ${baseurl}`) });
