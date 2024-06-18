import { Context, MiddlewareHandler } from 'hono'
import { BlankEnv } from 'hono/types'
import { validateApiKey } from '@/lib/db/auth'
import logger from '@/lib/logger'
import { getCookie, setCookie } from 'hono/cookie'


export function setAuthMsg(c:Context<BlankEnv, never, {}>, msg:string) {
    setCookie(c,"cluck_msg", msg, {path:"/auth/login"})
}
export function consumeAuthMsg(c:Context<BlankEnv, "/auth/login", {}>):string {
    setAuthMsg(c, "")
    return getCookie(c, "cluck_msg") ?? ""
}
const validateAuth = async (c: Context<BlankEnv, never, {}>) => {
    const api_key = c.req.header('X-Api-Key') ?? getCookie(c, "cluck_auth")
    const permissions = await validateApiKey(api_key)
    logger.info(`${c.req.method} ${c.req.url} from ${permissions.id} [write=${permissions.write}]`)
    c.set('auth_read', permissions.read)
    c.set('auth_write', permissions.write)
    c.set('auth_admin', permissions.admin)
}

export const requireReadLogin: MiddlewareHandler<BlankEnv, never, {}> = async (c, next) => {
    await validateAuth(c)
    if (c.get('auth_read')) {
        await next()
    } else {
        return c.redirect(`/auth/login?redirectTo=${c.req.path}`, 302)
    }
}
export const requireReadAPI: MiddlewareHandler<BlankEnv, never, {}> = async (c, next) => {
    await validateAuth(c)
    if (c.get('auth_read')) {
        await next()
    } else {
        c.status(401)
        return c.text('Invalid key')
    }
}

export const requireWriteLogin: MiddlewareHandler<BlankEnv, never, {}> = async (c, next) => {
    await validateAuth(c)
    if (c.get('auth_write')) {
        await next()
    } else {
        return c.redirect(`/auth/login?redirectTo=${c.req.path}&level=write`, 302)
    }
}

export const requireWriteAPI: MiddlewareHandler<BlankEnv, never, {}> = async (c, next) => {
    await validateAuth(c)
    if (c.get('auth_write')) {
        await next()
    } else {
        c.status(403)
        return c.text(c.get('auth_read') ? 'Insufficient permissions' : 'Invalid key')
    }
}

export const requireAdminLogin: MiddlewareHandler<BlankEnv, never, {}> = async (c, next) => {
    await validateAuth(c)
    if (c.get('auth_admin')) {
        await next()
    } else {
        return c.redirect(`/auth/login?redirectTo=${c.req.path}&level=admin`, 302)
    }
}
