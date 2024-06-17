import { Table, Column, Model, DataType, HasMany, Index } from 'sequelize-typescript'
import { MeetingAttendance } from './meetings'
import { HourLog } from './hours'
import logger from '@/lib/logger'
import { DatabaseError } from 'sequelize'
import { default_photo, default_photo_small } from '@config'

@Table
export class Member extends Model {
    @Column({ type: DataType.STRING(50), primaryKey: true, allowNull: false, unique: true })
    email!: string

    @Column({ type: DataType.STRING(50), allowNull: false })
    first_name!: string

    @Index
    @Column({ type: DataType.STRING(100), allowNull: false })
    full_name!: string

    @Column({ type: DataType.ENUM('junior', 'primary'), allowNull: false })
    team!: 'junior' | 'primary'

    @Column({ type: DataType.SMALLINT, allowNull: false })
    grade!: number

    @Column({ type: DataType.SMALLINT, allowNull: false })
    years!: number

    @Column({ type: DataType.BOOLEAN, allowNull: false })
    use_slack_photo!: boolean

    @Column({ type: DataType.STRING(15), allowNull: true })
    slack_id?: string

    @Column({ type: DataType.STRING, allowNull: true })
    slack_photo?: string

    @Column({ type: DataType.STRING, allowNull: true })
    slack_photo_small?: string

    @Column({ type: DataType.ENUM('weekly', 'department') })
    slack_leaderboard_type?: 'weekly' | 'department'

    @Column({ type: DataType.STRING(50) })
    slack_department?: string

    @Column({ type: DataType.STRING })
    fallback_photo?: string

    @Column({ type: DataType.ARRAY(DataType.STRING(15)), allowNull: true })
    cert_ids!: string[]

    @HasMany(() => MeetingAttendance, 'member_id')
    meetings!: MeetingAttendance[]

    @HasMany(() => HourLog, 'member_id')
    hours!: HourLog[]

    @Column({
        type: DataType.VIRTUAL,
        get() {
            const set = new Set(this.get('cert_ids') as string[])
            return { has: (v: string) => set.has(v) }
        }
    })
    certs!: ReadonlySet<string>

    get photo(): string {
        if (this.use_slack_photo && this.slack_photo != null) {
            return this.slack_photo
        }
        return this.fallback_photo ?? default_photo
    }
    get photo_small(): string {
        if (this.use_slack_photo && this.slack_photo_small != null) {
            return this.slack_photo_small
        }
        return this.fallback_photo ?? default_photo_small
    }
}

type ReadonlySet<T> = Pick<Set<T>, 'has'>

export async function createOrUpdateMember(data: Pick<Member, 'email' | 'full_name' | 'grade' | 'years' | 'team' | 'use_slack_photo'>): Promise<boolean> {
    const memberRecord: Partial<Member> = { ...data, first_name: data.full_name.split(' ')[0] }
    let success = true
    await Member.upsert(memberRecord, { returning: false }).catch((reason: DatabaseError) => {
        logger.debug(reason.original)
        logger.error(`${reason.name}: ${reason.original.message}`)
        success = false
    })
    return success
}

export async function updateMember(email: string, data: Partial<Member>): Promise<boolean> {
    let success = true
    logger.info("updating member")
    await Member.update({...data, email}, { where: { email } }).catch((reason: DatabaseError) => {
        logger.debug(reason.original)
        logger.error(`${reason.name}: ${reason.original.message}`)
        success = false
    })

    return success
}
