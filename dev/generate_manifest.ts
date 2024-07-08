import prod_manifest from './manifest.json'
import fs from 'fs/promises'
async function generate_dev(command_prefix: string) {
    const dev_manifest = structuredClone(prod_manifest)
    prod_manifest.features.slash_commands.forEach((command, i) => {
        dev_manifest.features.slash_commands[i] = {
            command: '/' + command_prefix + command.command.slice(1),
            description: command.description,
            should_escape: command.should_escape,
            usage_hint: command.usage_hint
        }
    })
    await fs.writeFile(`./dev/${command_prefix}manifest.json`, JSON.stringify(dev_manifest, null, 4))
}

await generate_dev('dev_')
