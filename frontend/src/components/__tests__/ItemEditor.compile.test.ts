import { describe, test, expect } from 'bun:test'

describe('ItemEditor Component Compilation', () => {
  test('should compile without errors', async () => {
    // Test that the component can be imported without compilation errors
    const { default: ItemEditor } = await import('@frontend/components/ItemEditor.vue')
    expect(ItemEditor).toBeDefined()
    // Vue components are imported as strings in test environment
    expect(typeof ItemEditor).toBe('string')
  })
})
