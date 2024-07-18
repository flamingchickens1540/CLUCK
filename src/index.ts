import type { Server as HttpServer } from 'http'

import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { appendTrailingSlash } from 'hono/trailing-slash'
import { compress } from 'hono/compress'
import { secureHeaders } from 'hono/secure-headers'

import { renderer } from '~lib/renderer'

import admin_router from '~routes/admin'
import api_router from '~routes/api'
import account_router from '~routes/auth'

import { requireAdminLogin, requireReadLogin } from '~lib/auth'
import logger from '~lib/logger'
import { startWS } from '~lib/sockets'
import { syncSlackMembers } from '~tasks/slack'

const app = new Hono()

// Don't interfere with socket.io
app.use('/ws/*', async (c, next) => {})

app.use(renderer)

app.use(compress())
app.use(appendTrailingSlash())
app.use(secureHeaders())
app.use(async (c, next) => {
    logger.debug(`${c.req.method} ${c.req.url}`)
    await next()
})

app.use('/admin/*', requireAdminLogin)
app.use('/grid/', requireReadLogin)
app.get('/grid', (c) => c.redirect('/grid/', 301))

app.route('/admin', admin_router)
app.route('/api', api_router)
app.route('/auth', account_router)

app.use('/static/*', serveStatic({ root: './' }))
app.use('/*', serveStatic({ root: './public' }))

const port = 3000

if (process.env.NODE_ENV === 'prod') {
    await syncSlackMembers()
}

const server = serve({ fetch: app.fetch, port }, (info) => {
    logger.info(`Server is running: http://${info.address}:${info.port}`)
})
startWS(server as HttpServer)
