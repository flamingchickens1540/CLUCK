import { BelongsTo, Column, DataType, ForeignKey, Index, Model, Table, Comment } from 'sequelize-typescript'
import { Member } from './members'
import { HourCategory } from 'src/types'

@Table
export class HourLog extends Model {
    @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true, autoIncrementIdentity: true })
    id!: number

    @Index
    @ForeignKey(() => Member)
    @Column({ type: DataType.STRING(50), allowNull: false })
    member_id!: string

    @Column({ type: DataType.DATE, allowNull: false })
    time_in!: Date

    @Column({ type: DataType.DATE, allowNull: true })
    time_out?: Date

    @Comment('hours')
    @Column({ type: DataType.DECIMAL(6, 3), allowNull: true })
    duration?: number

    @Index
    @Column({ type: DataType.ENUM('lab', 'external', 'summer', 'event'), allowNull: false })
    type!: HourCategory

    @Index
    @Column({ type: DataType.ENUM('complete', 'pending', 'cancelled'), allowNull: false })
    state!: 'complete' | 'pending' | 'cancelled'

    @Column({ type: DataType.STRING(2000), allowNull: true })
    message?: string

    @Comment('For external requests')
    @Column({ type: DataType.DECIMAL(16, 6), allowNull: true })
    slack_ts?: number

    @BelongsTo(() => Member)
    member!: Member
}
