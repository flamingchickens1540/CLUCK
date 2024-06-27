import express, { Router } from "express";
import fetch from "node-fetch";
import sanitizeHtml from 'sanitize-html';
import { basepath, drive_image_folder_id, drive_api_key } from "../secrets/consts";
import path from 'path'
// Dashboard


export const router = Router()

// Dashboard
let delphiPost = 0;
let imageI = 0;


router.get("/", (req, res) => res.redirect(path.join("/", basepath, "/dash/")))
router.use("/dash/", express.static("./www/dash", {redirect: false}))
router.use('/dash/', express.static("./dist/dash", {redirect:false}))
router.get('/dash/image', async (req, res, next) => {
    try{
        let resp = await fetch(`https://www.googleapis.com/drive/v3/files?q='${drive_image_folder_id}'%20in%20parents&key=${drive_api_key}&includeItemsFromAllDrives=true&includeTeamDriveItems=true&supportsTeamDrives=true`)
        let respj: any = await resp.json()
        console.log(respj)
        let images = respj.files.filter(file=>['image/png','image/jpeg','image/gif'].includes(file.mimeType))
        imageI++; imageI%=images.length
        res.send(`https://drive.google.com/uc?id=${images[imageI].id}`)
    } catch (e) {
        console.error(e)
        next(e)
    }
})
router.get('/dash/imageproxy', async (req, res, next) => {
    try{
        let url = req.query.googleurl as string;
        let response = await fetch(url, {
            "headers": {
              "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
              "accept-language": "en-US,en;q=0.9",
              "cache-control": "no-cache",
              "pragma": "no-cache",
              "priority": "u=0, i",
              "sec-ch-ua": "\"Not/A)Brand\";v=\"8\", \"Chromium\";v=\"126\", \"Google Chrome\";v=\"126\"",
              "sec-ch-ua-arch": "\"arm\"",
              "sec-ch-ua-bitness": "\"64\"",
              "sec-ch-ua-full-version-list": "\"Not/A)Brand\";v=\"8.0.0.0\", \"Chromium\";v=\"126.0.6478.127\", \"Google Chrome\";v=\"126.0.6478.127\"",
              "sec-ch-ua-mobile": "?0",
              "sec-ch-ua-model": "\"\"",
              "sec-ch-ua-platform": "\"macOS\"",
              "sec-ch-ua-platform-version": "\"14.2.1\"",
              "sec-ch-ua-wow64": "?0",
              "sec-fetch-dest": "document",
              "sec-fetch-mode": "navigate",
              "sec-fetch-site": "none",
              "sec-fetch-user": "?1",
              "upgrade-insecure-requests": "1",
            },
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": null,
            "method": "GET"
        });
        let blob = await response.blob();
        // source https://stackoverflow.com/questions/52665103/using-express-how-to-send-blob-object-as-response
        blob.arrayBuffer().then((buf) => {
            res.send(Buffer.from(buf))
        })
    } catch (e) {
        console.error(e)
        next(e)
    }
})
router.get('/dash/delphi', async (req, res) => {
    delphiPost++; delphiPost %= 20; // switch to next post
    
    try {
        const json = await (await fetch('https://www.chiefdelphi.com/latest.json?no_definitions=true&page=0')).json() as any
        const id = json.topic_list.topics[delphiPost].id
        const link = 'https://www.chiefdelphi.com/t/' + id
        const html = await (await fetch(link)).text() + `<myurl>${link}</myurl>`
        res.send(sanitizeHtml(html, {
            allowedClasses: {
                "*": ["*"]
            },
            allowedAttributes: {
                "*":  ["id", "class", "style" ],
                ...sanitizeHtml.defaults.allowedAttributes
            },
            allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img', 'myurl' ]),
            transformTags: {
                'a': "span",
                "img":function(tagName, attribs) {
                    return {
                        tagName: tagName,
                        attribs: {
                            ...attribs,
                            src : attribs.src.replace(/^\//, 'https://www.chiefdelphi.com/')
                        }
                    };
                }
            }
        }))
    } catch (e) {
        res.status(400).send("Error loading delphi post")
    }
})

// Grid

router.use('/grid/', express.static("./www/grid", {extensions: ['html'], redirect:false}))
router.use('/grid/', express.static("./dist/grid", {redirect:false}))



// Assets
router.use('/static/', express.static("./www/static"))
router.get('/favicon.ico', (req, res) => { res.sendFile('favicon.svg', { root: './www/static/img' }) })