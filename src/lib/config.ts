import { enum_Member_Team } from '@prisma/client'
import type template_config from '../../config/example.json'
import config_lib from 'config'

type Config = typeof template_config
process.env.NODE_CONFIG_STRICT_MODE = 'TRUE'

const current_config = config_lib.util.loadFileConfigs('./config') as Config
export default current_config

export const season_start_date = new Date(current_config.season_start_date!)
export const year_start_date = new Date(current_config.year_start_date)

export function getStartDate(team: enum_Member_Team | null) {
    return team == 'community' ? year_start_date : season_start_date
}
