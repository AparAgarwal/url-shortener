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
            // Code quality rules (not formatting)
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_|next' }],
            'no-console': 'off',
            'no-process-exit': 'off',
            'prefer-const': 'error',
            eqeqeq: ['error', 'always'],
            'no-var': 'error',
            'prefer-arrow-callback': 'warn',
            'prefer-template': 'warn',
            'object-shorthand': 'warn',
            curly: ['error', 'all']
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
