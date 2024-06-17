import { Column, DataType, Model, Table, Comment, ForeignKey, BelongsTo, HasMany, Index } from 'sequelize-typescript'
import { Member } from './members'
import logger from '@/lib/logger'
import { DatabaseError } from 'sequelize'

@Table
export class Cert extends Model {
    @Column({ type: DataType.STRING(15), primaryKey: true })
    id!: string

    @Column({ type: DataType.STRING(100), allowNull: false })
    label!: string

    @Column({ type: DataType.STRING(50), allowNull: false })
    department!: string

    @Comment('100 = manager')
    @Column({ type: DataType.SMALLINT, allowNull: false })
    level!: number
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
