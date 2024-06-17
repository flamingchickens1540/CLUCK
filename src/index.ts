import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { renderer } from './lib/renderer'
import admin_router from './routes/admin'
import api_router from './routes/api'
import { connectDatabase } from '@/lib/db'
import { syncSlackMembers } from '@/tasks/slack'
// import { createCertChangeListener } from '@/tasks/certs'

const app = new Hono()
app.use(renderer)
app.get('/', (c) => {
    return c.text('Hello Hono!')
})

app.use('/static/*', serveStatic({ root: './' }))
app.route('/admin', admin_router)
app.route('/api', api_router)

const port = 3000
console.log(`Server is running on port ${port}`)
;(async () => {
    await connectDatabase()
    // await createCertChangeListener()
    // await syncSlackMembers()
    serve({
        fetch: app.fetch,
        port
    })
})()
