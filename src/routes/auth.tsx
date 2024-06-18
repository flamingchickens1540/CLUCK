import { Hono } from 'hono'
import { validateLogin } from '@/lib/db/auth'
import { setCookie } from 'hono/cookie'
import { consumeAuthMsg, setAuthMsg } from '@/lib/auth'

const router = new Hono()

router
    .get('/login', (c) => {
        return c.render(
            <div class="min-h-screen flex items-center justify-center">
                <div class="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
                    <h1 class="text-2xl font-semibold text-center text-gray-500 mt-8 mb-6 capitalize">Sign in {c.req.query('level') ? `- ${c.req.query('level')}` : ``}</h1>
                    <form method="post">
                        <div class="mb-6">
                            <label for="id" class="block mb-2 text-sm text-gray-600">
                                User ID
                            </label>
                            <input type="text" id="id" name="id" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                        </div>
                        <div class="mb-6">
                            <label for="password" class="block mb-2 text-sm text-gray-600">
                                Password
                            </label>
                            <input type="password" id="password" name="password" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" required />
                        </div>
                        <input type="submit" class="w-32 bg-gradient-to-r from-cyan-400 to-cyan-600 text-white py-2 rounded-lg mx-auto block focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 mt-4 mb-6" />
                    </form>
                    <p>{consumeAuthMsg(c)}</p>
                </div>
            </div>,
            { body_class: 'bg-gray-100' }
        )
    })
    .post(async (c) => {
        const { id, password } = await c.req.parseBody()
        const destination = c.req.query('redirectTo') ?? '/'
        const level = c.req.query('level')?.toLowerCase() ?? 'read'

        if (typeof id !== 'string' || typeof password !== 'string') {
            setAuthMsg(c, 'Missing username or password')
            return c.redirect(c.req.url, 302)
        }
        const auth = await validateLogin(id, password)
        if (!auth.valid) {
            setAuthMsg(c, 'Invalid username or password')
            return c.redirect(c.req.url, 302)
        }
        if (level == 'admin' && !auth.admin) {
            setAuthMsg(c, 'This page requires an admin account')
            return c.redirect(c.req.path, 302)
        }
        if (level == 'write' && !auth.write) {
            setAuthMsg(c, 'This page requires a write account')
            return c.redirect(c.req.path, 302)
        }
        setCookie(c, 'cluck_auth', auth.key, { expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), httpOnly: true, secure: true })
        return c.redirect(destination, 302)
    })

export default router
