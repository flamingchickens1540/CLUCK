

import { CronJob } from 'cron';
import express from 'express';
import { existsSync, mkdirSync } from 'fs';
import { server_port } from '../secrets/consts.js';
import { router as apiRouter } from './api/index.js';
import { baseurl, dataDirectory } from './consts';
import { collect } from './member-collector/collector';
import { router as memberRouter} from './member-collector/router';
import { router as frontendRouter } from './router';


// Refresh profile images every day
new CronJob({
    cronTime: '0 0 * * *',
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
app.use("/api", apiRouter)
app.use("/api", memberRouter)
app.use("/", frontendRouter)

// Init data directory



// Redirect unknown routes to dashboard
app.use(function (req,res){
    console.log("Error 404", req.url)
	res.status(404).end()
});

app.listen(server_port, () => { console.log(`listening: ${baseurl}`) });
