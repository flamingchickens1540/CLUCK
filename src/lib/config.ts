import { enum_Member_Team } from '~prisma'
import type template_config from '../../config/example.json'
import config_lib from 'config'
import prisma from './prisma'
import logger from './logger'

type Config = typeof template_config
process.env.NODE_CONFIG_STRICT_MODE = 'TRUE'

const current_config = config_lib.util.loadFileConfigs('./config') as Config
export default current_config

const now = new Date()
export const extra_config = {
    season_start_date: now.getMonth() >= 6 ? new Date(now.getFullYear(), 5, 1) : new Date(now.getFullYear(), 0, 1),
    year_start_date: now.getMonth() >= 6 ? new Date(now.getFullYear(), 5, 1) : new Date(now.getFullYear() - 1, 5, 1),
    update_spreadsheet_certs: true
}

export async function refreshState() {
    await prisma.state.createMany({
        skipDuplicates: true,
        data: [
            {
                key: 'season_start',
                valDate: extra_config.season_start_date
            },
            {
                key: 'year_start',
                valDate: extra_config.year_start_date
            },
            {
                key: 'update_spreadsheet_certs',
                valBool: extra_config.update_spreadsheet_certs
            }
        ]
    })
    extra_config.season_start_date = (await prisma.state.findUnique({ where: { key: 'season_start' } }))?.valDate ?? extra_config.season_start_date
    extra_config.year_start_date = (await prisma.state.findUnique({ where: { key: 'year_start' } }))?.valDate ?? extra_config.year_start_date
    extra_config.update_spreadsheet_certs = (await prisma.state.findUnique({ where: { key: 'update_spreadsheet_certs' } }))?.valBool ?? extra_config.update_spreadsheet_certs
}

export function getStartDate(team: enum_Member_Team | null) {
    return team == 'community' ? extra_config.year_start_date : extra_config.season_start_date
}
