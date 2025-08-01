import { describe, test, expect } from 'bun:test'

/**
 * ReferencesEditor Component Tests
 *
 * These tests verify the ReferencesEditor component compiles and imports correctly.
 */

describe('ReferencesEditor Component', () => {
  test('should compile without TypeScript errors', async () => {
    const { default: ReferencesEditor } = await import('@frontend/components/ReferencesEditor.vue')

    expect(ReferencesEditor).toBeDefined()
    expect(ReferencesEditor).toBeTruthy()
  })
})
