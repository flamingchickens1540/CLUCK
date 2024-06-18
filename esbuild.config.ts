import htmlPlugin from '@chialab/esbuild-plugin-html'
import esbuild from 'esbuild'
import fs from 'fs/promises'
import path from 'path'

const views = await fs.readdir('src/views')
for (const view of views) {
    const id = path.basename(view)
    await esbuild.build({
        entryPoints: [path.join(view, 'index.html')],
        outdir: 'public',
        assetNames: `assets/[name]-[hash]`,
        chunkNames: `assets/${id}/[name]-[hash]`,
        plugins: [htmlPlugin()]
    })
}
