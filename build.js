import { build } from "esbuild"
import {readFileSync} from "fs"




const excludeSecretsFromSourcemap = {
    name: 'excludeSecretsFromSourcemap',
    setup(build) {
        build.onLoad({ filter:/secrets/ }, (args) => {
            return {
                contents:
                readFileSync(args.path, 'utf8') +
                '\n//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIiJdLCJtYXBwaW5ncyI6IkEifQ==',
                loader: 'default',
            };
        });
    },
};

const defaultOptions = {
    format:"iife",
    bundle: true,
    minify: process.env.NODE_ENV == "production",
    sourcemap: true,
    platform: "browser",
    plugins: [excludeSecretsFromSourcemap]
}


await build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    sourcemap: true,
    outfile: 'dist/app.cjs',
    platform:"node",
})

await build({
    entryPoints: ['src/frontend/grid/index.ts'],
    outfile: 'dist/grid/index.js',
    ...defaultOptions,
})

await build({
    entryPoints: ['src/frontend/grid/index.login.ts'],
    outfile: 'dist/grid/login.js',
    ...defaultOptions
})

await build({
    entryPoints: ['src/frontend/dash/index.ts'],
    outfile: 'dist/dash/index.js',
    ...defaultOptions
})

