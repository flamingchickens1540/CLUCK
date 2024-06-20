import logger from '@/lib/logger'
import crypto from 'crypto'
import prisma from '@/lib/db/index'
import { Account } from '@prisma/client'

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
type KeyAuth = { read: boolean; write: boolean; admin: boolean }
type KeyValidation = { id: string } & KeyAuth
type LoginValidation = ({ valid: true; key: string } & KeyAuth) | { valid: false }

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
