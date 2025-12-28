import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
    js.configs.recommended,
    prettierConfig,
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                console: 'readonly',
                process: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                Buffer: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                URL: 'readonly'
            }
        },
        plugins: {
            prettier
        },
        rules: {
            'prettier/prettier': 'error',
            indent: ['error', 4],
            quotes: ['error', 'single', { avoidEscape: true }],
            semi: ['error', 'always'],
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_|next' }],
            'no-console': 'off',
            'no-process-exit': 'off',
            'prefer-const': 'error',
            'arrow-spacing': ['error', { before: true, after: true }],
            'comma-dangle': ['error', 'never'],
            eqeqeq: ['error', 'always'],
            'no-var': 'error',
            'prefer-arrow-callback': 'warn',
            'prefer-template': 'warn',
            'object-shorthand': 'warn',
            'no-trailing-spaces': 'error',
            'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
            'space-before-function-paren': [
                'error',
                {
                    anonymous: 'always',
                    named: 'never',
                    asyncArrow: 'always'
                }
            ],
            'keyword-spacing': ['error', { before: true, after: true }],
            'space-infix-ops': 'error',
            'comma-spacing': ['error', { before: false, after: true }],
            'brace-style': ['error', '1tbs', { allowSingleLine: true }],
            curly: ['error', 'all'],
            'no-multi-spaces': 'error'
        }
    },
    {
        ignores: [
            'node_modules/**',
            'dist/**',
            'build/**',
            '*.min.js',
            'coverage/**',
            '.env*',
            'public/**'
        ]
    }
];
