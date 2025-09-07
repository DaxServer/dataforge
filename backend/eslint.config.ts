import tseslint from 'typescript-eslint'
import eslintPluginPrettier from 'eslint-plugin-prettier'

export default tseslint.config(
  {
    ignores: ['node_modules/**', 'dist/**', '*.d.ts', 'dataforge.db'],
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      prettier: eslintPluginPrettier,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-expect-error': 'allow-with-description' },
      ],
      'comma-dangle': ['error', 'always-multiline'],
      'prettier/prettier': 'error',
    },
  },
)
