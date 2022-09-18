import express, { Router } from "express";
import fetch from "node-fetch";
import sanitizeHtml from 'sanitize-html';
import { basepath, baseurl } from "../secrets/consts";
import path from 'path'
import fs from 'fs'
// Dashboard


export const router = Router()

// Dashboard
let delphiPost = 0;

router.get("/base.js", (req, res) => {
    res.setHeader("Content-Type", "application/javascript");
    res.send(`const baseurl = "${path.normalize(baseurl).replace(/\/+$/, "")}";const basepath = "/${basepath.replace(/\/+$/, "")}";const api_url = "${path.normalize(path.join("/",basepath, "/api")).replace(/\/+$/, "")}";`);
})
router.get("/grid/style.css", (req, res) => {
    res.setHeader("Content-Type", "text/css");
    res.send(fs.readFileSync("./www/grid/style.css", "utf8").replaceAll(/{baseurl}/g, path.join("/", basepath).replace(/\/+$/, "")));
})
router.get("/", (req, res) => res.redirect(baseurl+'/dash/'))
router.get("/dash", (req, res) => res.sendFile("www/dash/index.html", { root: "./" }))
router.use("/dash", express.static("./www/dash"))
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
router.get("/grid", (req, res) => res.sendFile("www/grid/index.html", { root: "./" }))
router.use('/grid', express.static("./www/grid", {extensions: ['html','js','css']}))



// Assets
router.use('/static/', express.static("./www/static"))
router.get('/favicon.ico', (req, res) => { res.sendFile('favicon.svg', { root: './www/static/img' }) })