import { generateCode } from '@daxserver/validation-schema-codegen'

// Generate TypeBox code
const typeboxCode = generateCode({
  filePath: `${__dirname}/../../node_modules/wikibase-sdk/dist/src/types/entity.d.ts`,
})

// Write the generated code to the output file
const outputPath = `${__dirname}/../src/types/wikibase-schema.ts`
await Bun.write(outputPath, typeboxCode)
console.log(`TypeBox schemas generated at ${outputPath}`)
