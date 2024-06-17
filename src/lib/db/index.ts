import { Sequelize } from 'sequelize-typescript'

import logger from '../logger'
import { Member } from './members'
import { Cert, MemberCert } from './certs'
import { Meeting, MeetingAttendance } from './meetings'
import { HourLog } from './hours'
import { postgres_connection_string } from '@config'

const sequelize = new Sequelize(postgres_connection_string, {
    logging: (msg) => logger.trace(msg),
    models: [Member, Cert, MemberCert, Meeting, MeetingAttendance, HourLog]
})

export async function connectDatabase() {
    logger.info('Connecting...')
    try {
        await sequelize.authenticate()
        await sequelize.sync()
        logger.info('Connection has been established successfully.')
    } catch (error) {
        logger.error('Unable to connect to the database:', error)
    }
}
