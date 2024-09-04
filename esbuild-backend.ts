import esbuild from 'esbuild'

await esbuild.build({
    entryPoints: ['src/index.ts'],
    tsconfig: 'tsconfig.json',
    bundle: true,
    packages: 'external',
    platform: 'node',
    format: 'esm',
    sourcemap: 'linked',
    outfile: 'build/index.js'
})
