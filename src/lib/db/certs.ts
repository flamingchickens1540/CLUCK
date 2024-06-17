import { Column, DataType, Model, Table, Comment, ForeignKey, BelongsTo, HasMany, Index } from 'sequelize-typescript'
import { Member } from './members'
import logger from '@/lib/logger'
import { DatabaseError } from 'sequelize'

@Table
export class Cert extends Model {
    @Column({ type: DataType.STRING(20), primaryKey: true })
    id!: string

    @Column({ type: DataType.STRING(100), allowNull: false })
    label!: string

    @Column({ type: DataType.STRING(50), allowNull: false })
    department!: string

    @Comment('100 = manager')
    @Column({ type: DataType.SMALLINT, allowNull: false })
    level!: number

    @HasMany(() => MemberCert)
    instances!: MemberCert[]
}

@Table
export class MemberCert extends Model {
    @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true, autoIncrementIdentity: true })
    id!: number

    @Index
    @ForeignKey(() => Member)
    @Column({ type: DataType.STRING(50), allowNull: false })
    member_id!: string

    @ForeignKey(() => Cert)
    @Column({ type: DataType.STRING(20), allowNull: false })
    cert_id!: string

    @BelongsTo(() => Cert, 'cert_id')
    cert!: Cert

    @BelongsTo(() => Member, 'member_id')
    member!: Member
}

export async function updateCert(data: Pick<Cert, 'id' | 'label' | 'department' | 'level'>): Promise<boolean> {
    let success = true
    await Cert.upsert(data, { returning: false }).catch((reason: DatabaseError) => {
        logger.debug(reason.original)
        logger.error(`${reason.name}: ${reason.original.message}`)
        success = false
    })
    return success
}
