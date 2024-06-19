import htmlPlugin from '@chialab/esbuild-plugin-html'
import { sassPlugin } from 'esbuild-sass-plugin'
import esbuild from 'esbuild'
import fs from 'fs/promises'
import path from 'path'
import logger from '@/lib/logger'

if (!(await fs.stat('./public')).isDirectory()) {
    await fs.mkdir('./public')
}

const views = await fs.readdir('src/views')
const contexts: esbuild.BuildContext[] = []
for (const view of views) {
    const id = path.basename(view)
    const viewpath = path.join('src/views', view)
    if ((await fs.stat(viewpath)).isDirectory()) {
        contexts.push(
            await esbuild.context({
                entryPoints: [path.join('src/views', view, 'index.html')],
                outdir: `public/${id}`,
                assetNames: `assets/[name]`,
                chunkNames: `assets/[name]`,
                plugins: [
                    sassPlugin(),
                    htmlPlugin({ minifyOptions: { minifySvg: false } }),
                    {
                        name: 'rebuild-notify',
                        setup(build) {
                            build.onEnd((result) => {
                                logger.debug(`build ended with ${result.errors.length} errors`)
                                // HERE: somehow restart the server from here, e.g., by sending a signal that you trap and react to inside the server.
                            })
                        }
                    }
                ],
                bundle: true,
                minify: true,
                sourcemap: 'inline',
                external: ['/static/*']
            })
        )
        logger.info('Loaded build context for ' + id)
    }
}
const watch = process.argv.includes('--watch')
// const endPromise = Promise.all(
//     contexts.map(async (context) => {
//         if (watch) {
//             logger.info('adding watch listener')
//             await context.watch({})
//         } else {
//             await context.rebuild()
//             await context.dispose()
//         }
//     })
// )
if (watch) {
    logger.info('Watching...')
    await contexts[0].watch()
    logger.info('Done...')
} else {
    logger.info('Building...')
    // await endPromise
    logger.info('Build complete')
}
