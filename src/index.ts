import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { appendTrailingSlash } from 'hono/trailing-slash'
import { compress } from 'hono/compress'

import { renderer } from './lib/renderer'

import admin_router from './routes/admin'
import api_router from './routes/api'
import account_router from './routes/auth'

import { connectDatabase } from '@/lib/db'
import { createCertChangeListener } from '@/tasks/certs'
import { requireReadLogin } from '@/lib/auth'
import logger from '@/lib/logger'
import { startWS } from '@/lib/ws'

const app = new Hono()
app.use(renderer)
app.get('/', (c) => {
    return c.text('Hello Hono!')
})
// app.use(compress())
app.use(appendTrailingSlash())
app.use('/grid/', requireReadLogin)
app.get('/grid', (c) => c.redirect('/grid/', 301))

app.route('/admin', admin_router)
app.route('/api', api_router)
app.route('/auth', account_router)
app.use('/static/*', serveStatic({ root: './' }))
app.use('/*', serveStatic({ root: './public' }))

const port = 3000

await connectDatabase()
await createCertChangeListener()
startWS()
// await syncSlackMembers()

serve(
    {
        fetch: app.fetch,
        port
    },
    (info) => {
        logger.info(`Server is running: http://${info.address}:${info.port}`)
    }
)
