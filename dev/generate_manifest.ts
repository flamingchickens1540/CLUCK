import prod_manifest from './manifest.json'
import fs from 'fs/promises'
import config from '@config'

const dev_manifest = structuredClone(prod_manifest)
const prefix = config.slack.app.command_prefix
if (prefix) {
    dev_manifest.features.slash_commands.forEach((cmd) => {
        cmd.command = '/' + prefix + '_' + cmd.command.slice(1)
    })
    dev_manifest.display_information.name += ` ${prefix}`
    dev_manifest.features.bot_user.display_name += ` ${prefix}`
}
await fs.writeFile(`./dev/${prefix}.manifest.json`, JSON.stringify(dev_manifest, null, 4))
