import * as Codegen from '@sinclair/typebox-codegen'

async function main() {
  // Read the Wikibase SDK entity type definitions
  const dtsPath = 'node_modules/wikibase-sdk/dist/src/types/entity.d.ts'
  const dts = await Bun.file(dtsPath).text()

  // Generate TypeBox code
  const typeboxCode = Codegen.TypeScriptToTypeBox.Generate(dts)

  // Write the generated code to the output file
  const outputPath = 'backend/src/types/wikibase-schema.ts'
  await Bun.write(outputPath, typeboxCode)
  console.log(`TypeBox schemas generated at ${outputPath}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
