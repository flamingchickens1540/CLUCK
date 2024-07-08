import template_config from '../../config/example.json'
type Config = typeof template_config
process.env.NODE_CONFIG_STRICT_MODE = 'TRUE'

import config_lib from 'config'
const current_config = config_lib.util.loadFileConfigs('./config') as Config
export default current_config
