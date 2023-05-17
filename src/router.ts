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
        let images = respj.files.filter(file=>file.mimeType.includes('image'))
        imageI++; imageI%=images.length
        res.send(`https://drive.google.com/uc?id=${images[imageI].id}`)
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