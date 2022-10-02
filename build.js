import { buildSync } from "esbuild"
buildSync({
    entryPoints: ['src/index.ts'],
    bundle: true,
    sourcemap: true,
    outfile: 'dist/app.cjs',
    platform:"node",
})


const defaultOptions = {
    format:"iife",
    bundle: true,
    minify: process.env.NODE_ENV == "production",
    sourcemap:true,
    platform: "browser",
}
buildSync({
    entryPoints: ['src/frontend/grid/index.ts'],
    outfile: 'dist/grid/index.js',
    ...defaultOptions
})

buildSync({
    entryPoints: ['src/frontend/grid/index.login.ts'],
    outfile: 'dist/grid/login.js',
    ...defaultOptions
})

buildSync({
    entryPoints: ['src/frontend/dash/index.ts'],
    outfile: 'dist/dash/index.js',
    ...defaultOptions
})