import { Context, MiddlewareHandler } from 'hono'
import { BlankEnv } from 'hono/types'
import logger from '@/lib/logger'
import { getCookie, setCookie } from 'hono/cookie'
import prisma from '@/lib/prisma'
import crypto from 'crypto'
import { Account } from '@prisma/client'

type KeyAuth = { read: boolean; write: boolean; admin: boolean }
type KeyValidation = { id: string } & KeyAuth
type LoginValidation = ({ valid: true; key: string } & KeyAuth) | { valid: false }

export async function createUser(id: string, password: string, write_access: boolean, admin_access: boolean): Promise<Account> {
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex')
    logger.info('Creating user ' + id)
    return prisma.account.create({
        data: {
            id,
            password: hashedPassword,
            write_access,
            admin_access,
            api_key: crypto.randomUUID()
        }
    })
}
export async function validateLogin(id: string, password: string): Promise<LoginValidation> {
    const acc = await prisma.account.findFirst({ where: { id } })
    if (!acc) {
        return { valid: false }
    }
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex')
    if (hashedPassword != acc.password) {
        return { valid: false }
    }
    return { valid: true, key: acc.api_key, read: true, write: acc.write_access, admin: acc.admin_access }
}

export async function validateApiKey(key?: string): Promise<KeyValidation> {
    if (!key) {
        return { id: 'none', read: false, write: false, admin: false }
    }
    const acc = await prisma.account.findFirst({ where: { api_key: key }, select: { id: true, write_access: true, admin_access: true } })
    if (!acc) {
        return { id: 'none', read: false, write: false, admin: false }
    }
    return { id: acc.id, read: true, write: acc.write_access, admin: acc.admin_access }
}
export function setAuthMsg(c: Context<BlankEnv, never, object>, msg: string) {
    setCookie(c, 'cluck_msg', msg, { path: '/auth/login' })
}
export function consumeAuthMsg(c: Context<BlankEnv, '/auth/login', object>): string {
    setAuthMsg(c, '')
    return getCookie(c, 'cluck_msg') ?? ''
}
const validateAuth = async (c: Context<BlankEnv, never, object>) => {
    const api_key = c.req.header('X-Api-Key') ?? getCookie(c, 'cluck_auth')
    const permissions = await validateApiKey(api_key)
    logger.info(`${c.req.method} ${c.req.url} from ${permissions.id} [write=${permissions.write}]`)
    c.set('auth_read', permissions.read)
    c.set('auth_write', permissions.write)
    c.set('auth_admin', permissions.admin)
}

export const requireReadLogin: MiddlewareHandler<BlankEnv, never, object> = async (c, next) => {
    await validateAuth(c)
    if (c.get('auth_read')) {
        await next()
    } else {
        return c.redirect(`/auth/login?redirectTo=${c.req.path}`, 302)
    }
}
export const requireReadAPI: MiddlewareHandler<BlankEnv, never, object> = async (c, next) => {
    await validateAuth(c)
    if (c.get('auth_read')) {
        await next()
    } else {
        c.status(401)
        return c.text('Invalid key')
    }
}

export const requireWriteLogin: MiddlewareHandler<BlankEnv, never, object> = async (c, next) => {
    await validateAuth(c)
    if (c.get('auth_write')) {
        await next()
    } else {
        return c.redirect(`/auth/login?redirectTo=${c.req.path}&level=write`, 302)
    }
}

export const requireWriteAPI: MiddlewareHandler<BlankEnv, never, object> = async (c, next) => {
    await validateAuth(c)
    if (c.get('auth_write')) {
        await next()
    } else {
        c.status(403)
        return c.text(c.get('auth_read') ? 'Insufficient permissions' : 'Invalid key')
    }
}

export const requireAdminLogin: MiddlewareHandler<BlankEnv, never, object> = async (c, next) => {
    await validateAuth(c)
    if (c.get('auth_admin')) {
        await next()
    } else {
        return c.redirect(`/auth/login?redirectTo=${c.req.path}&level=admin`, 302)
    }
}
