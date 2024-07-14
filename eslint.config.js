// @ts-check

import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    { files: ['src/**/*.ts'] },
    {
        ignores: ['public/', '**/moses.js', '**/_*.ts']
    },
    { files: ['static/js/**.js'], languageOptions: { globals: globals.browser } },
    {
        rules: {
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': 'warn',
            'prefer-const': 'warn'
        }
    }
)
