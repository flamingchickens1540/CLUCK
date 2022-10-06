import express, { Router } from "express";
import fetch from "node-fetch";
import sanitizeHtml from 'sanitize-html';
import { basepath } from "../secrets/consts";
import path from 'path'
// Dashboard


export const router = Router()

// Dashboard
let delphiPost = 0;


router.get("/", (req, res) => res.redirect(path.join("/", basepath, "/dash/")))
router.use("/dash/", express.static("./www/dash", {redirect: false}))
router.use('/dash/', express.static("./dist/dash", {redirect:false}))
router.get('/dash/delphi', async (req, res) => {
    delphiPost++; delphiPost %= 20; // switch to next post
    const json = await (await fetch('https://www.chiefdelphi.com/latest.json?no_definitions=true&page=0')).json() as any
    try {
        const id = json.topic_list.topics[delphiPost].id
        const link = 'https://www.chiefdelphi.com/t/' + id
        const html = await (await fetch(link)).text()
        res.send(sanitizeHtml(html, {
            allowedClasses: {
                "*": ["*"]
            },
            allowedAttributes: {
                "*":  ["id", "class", "style" ],
                ...sanitizeHtml.defaults.allowedAttributes
            },
            allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img' ]),
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