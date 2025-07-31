import { describe, test, expect } from 'bun:test'

describe('ItemEditor Integration', () => {
  test('should be importable by WikibaseSchemaEditor', async () => {
    // Test that ItemEditor can be imported alongside other components
    const [{ default: ItemEditor }, { default: WikibaseSchemaEditor }, { default: ColumnPalette }] =
      await Promise.all([
        import('@frontend/components/ItemEditor.vue'),
        import('@frontend/components/WikibaseSchemaEditor.vue'),
        import('@frontend/components/ColumnPalette.vue'),
      ])

    expect(ItemEditor).toBeDefined()
    expect(WikibaseSchemaEditor).toBeDefined()
    expect(ColumnPalette).toBeDefined()
  })
})
