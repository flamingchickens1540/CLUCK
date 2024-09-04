import { Hono } from 'hono'
import logger from '~lib/logger'
import Parser from 'rss-parser'

export const router = new Hono()

export type PostItem = {
    'creator': string
    'title': string
    'link': string
    'pubDate': string
    'dc:creator': string
    'content': string
    'contentSnippet': string
    'guid': string
    'categories': string[]
    'isoDate': string
}
const parser = new Parser<Record<string, unknown>, PostItem>({
    customFields: {
        item: ['creator', 'link']
    }
})
let delphiPost = 0
router.get('/chiefdelphi', async (c) => {
    delphiPost++
    delphiPost %= 20 // switch to next post
    try {
        const resp = await parser.parseURL('https://www.chiefdelphi.com/latest.rss')
        return c.json(resp.items[delphiPost])
    } catch (e) {
        logger.warn(e)
        return c.text('Error loading delphi post', 500)
    }
})
