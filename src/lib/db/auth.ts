import { Column, DataType, Model, Table, Comment, Index } from 'sequelize-typescript'
import logger from '@/lib/logger'
import crypto from 'crypto'

@Table
export class Account extends Model {
    @Column({ type: DataType.STRING, primaryKey: true })
    id!: string

    @Comment('sha256 with hex encoding')
    @Column({ type: DataType.CHAR(64), allowNull: false })
    password!: string

    @Index
    @Column({ type: DataType.CHAR(36), allowNull: false })
    api_key!: string

    @Column({ type: DataType.BOOLEAN, allowNull: false })
    write_access!: boolean

    @Column({ type: DataType.BOOLEAN, allowNull: false })
    admin_access!: boolean
}

export async function createUser(id: string, password: string, write_access: boolean, admin_access: boolean): Promise<Account> {
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex')
    logger.info('Creating user ' + id)
    return await Account.create({ id, password: hashedPassword, write_access, admin_access, api_key: crypto.randomUUID() })
}
type KeyAuth = { read: boolean; write: boolean; admin: boolean }
type KeyValidation = { id: string } & KeyAuth
type LoginValidation = ({ valid: true; key: string } & KeyAuth) | { valid: false }

export async function validateLogin(id: string, password: string): Promise<LoginValidation> {
    const acc = await Account.findOne({ where: { id } })
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
    const acc = await Account.findOne({ where: { api_key: key }, attributes: ['id', 'write_access', 'admin_access'] })
    if (!acc) {
        return { id: 'none', read: false, write: false, admin: false }
    }
    return { id: acc.id, read: true, write: acc.write_access, admin: acc.admin_access }
}
