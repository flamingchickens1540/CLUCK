// @ts-check

import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    { files: ['src/**/*.ts'] },
    {
        ignores: ['public/', '**/moses.js', '**/_*.ts']
    },
    {
        rules: {
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': 'warn',
            'prefer-const': 'warn'
        }
    }
)
