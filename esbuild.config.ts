import htmlPlugin from '@chialab/esbuild-plugin-html'
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
                plugins: [htmlPlugin({ minifyOptions: { minifySvg: false } })],
                bundle: true,
                minify: true,
                external: ['/static/*']
            })
        )
        logger.info('Loaded build context for ' + id)
    }
}
const watch = process.argv.includes('--watch')
const endPromise = Promise.all(
    contexts.map(async (context) => {
        if (watch) {
            await context.watch()
        } else {
            await context.rebuild()
            await context.dispose()
        }
    })
)
if (watch) {
    logger.info('Watching...')
    await endPromise
} else {
    logger.info('Building...')
    await endPromise
    logger.info('Build complete')
}
