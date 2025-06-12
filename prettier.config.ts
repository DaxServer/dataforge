import type { Config } from 'prettier'

const config: Config = {
  $schema: 'https://json.schemastore.org/prettierrc',
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  useTabs: false,
  printWidth: 100,
  trailingComma: 'es5',
  bracketSpacing: true,
  arrowParens: 'always',
  bracketSameLine: false,
  singleAttributePerLine: true,
  vueIndentScriptAndStyle: false,
  htmlWhitespaceSensitivity: 'ignore',
  endOfLine: 'lf',
  overrides: [
    {
      files: ['*.ts'],
      options: {
        parser: 'typescript',
      },
    },
    {
      files: ['*.vue'],
      options: {
        parser: 'vue',
      },
    },
    {
      files: ['*.d.ts'],
      options: {
        printWidth: Infinity,
      },
    },
  ],
}

export default config
