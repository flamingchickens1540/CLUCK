import { BelongsTo, Column, DataType, ForeignKey, HasMany, Index, Model, Table } from 'sequelize-typescript'
import { Member } from './members'

@Table
export class Meeting extends Model {
    @Column({
        type: DataType.SMALLINT,
        primaryKey: true,
        autoIncrement: true,
        autoIncrementIdentity: true
    })
    id!: number

    @Column({ type: DataType.DATEONLY, allowNull: false })
    date!: Date

    @Column({ type: DataType.BOOLEAN, allowNull: false })
    mandatory!: boolean

    @HasMany(() => MeetingAttendance)
    attendants!: MeetingAttendance[]
}

@Table
export class MeetingAttendance extends Model {
    @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true, autoIncrementIdentity: true })
    id!: number

    @Column({ type: DataType.ENUM('present', 'absent', 'no_credit'), allowNull: false })
    state!: 'present' | 'absent' | 'no_credit'

    @Index
    @ForeignKey(() => Meeting)
    @Column({ type: DataType.SMALLINT, allowNull: false })
    meeting_id!: number

    @Index
    @ForeignKey(() => Member)
    @Column({ type: DataType.STRING(50), allowNull: false })
    member_id!: string

    @BelongsTo(() => Meeting, 'meeting_id')
    meeting!: Meeting

    @BelongsTo(() => Member, 'member_id')
    member!: Member
}
