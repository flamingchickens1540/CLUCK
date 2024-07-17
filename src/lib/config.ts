import type template_config from '../../config/example.json'
import config_lib from 'config'

type Config = typeof template_config
process.env.NODE_CONFIG_STRICT_MODE = 'TRUE'

const current_config = config_lib.util.loadFileConfigs('./config') as Config
export default current_config
