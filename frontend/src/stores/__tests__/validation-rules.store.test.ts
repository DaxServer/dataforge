import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { createPinia, setActivePinia } from 'pinia'
import { useValidationStore } from '@frontend/stores/validation.store'
import type { ValidationRuleConfig } from '@frontend/stores/validation.store'

describe('useValidationStore - Rules functionality', () => {
  let store: ReturnType<typeof useValidationStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useValidationStore()
  })

  describe('initial state', () => {
    it('should start with no validation rules', () => {
      expect(store.rules).toHaveLength(0)
      expect(store.enabledRules).toHaveLength(0)
      expect(store.errorRules).toHaveLength(0)
      expect(store.warningRules).toHaveLength(0)
    })

    it('should categorize rules by severity after adding rules', () => {
      const errorRule: ValidationRuleConfig = {
        id: 'error-rule',
        name: 'Error Rule',
        fieldPath: 'test.error',
        message: 'Error field is required',
        severity: 'error',
        enabled: true,
        validator: mock(),
      }

      const warningRule: ValidationRuleConfig = {
        id: 'warning-rule',
        name: 'Warning Rule',
        fieldPath: 'test.warning',
        message: 'Warning field is recommended',
        severity: 'warning',
        enabled: true,
        validator: mock(),
      }

      store.addRule(errorRule)
      store.addRule(warningRule)

      expect(store.errorRules).toHaveLength(1)
      expect(store.warningRules).toHaveLength(1)
      expect(store.errorRules[0]?.id).toBe('error-rule')
      expect(store.warningRules[0]?.id).toBe('warning-rule')
    })
  })

  describe('rule management', () => {
    it('should add new rule', () => {
      const newRule: ValidationRuleConfig = {
        id: 'test-rule',
        name: 'Test Rule',
        fieldPath: 'test.field',
        message: 'Test field is required',
        severity: 'error',
        enabled: true,
        validator: mock(),
      }

      store.addRule(newRule)

      expect(store.rules).toHaveLength(1)
      expect(store.getRuleById('test-rule')).toEqual(newRule)
    })

    it('should update existing rule when adding with same id', () => {
      // Add the original rule first
      store.addRule({
        id: 'schema-name-required',
        name: 'Schema Name Required',
        fieldPath: 'schema.name',
        message: 'Schema name is required',
        severity: 'error',
        enabled: true,
        validator: mock(),
      })

      const updatedRule: ValidationRuleConfig = {
        id: 'schema-name-required',
        name: 'Updated Schema Name Rule',
        fieldPath: 'schema.name',
        message: 'Updated message',
        severity: 'warning',
        enabled: false,
        validator: mock(),
      }

      store.addRule(updatedRule)

      expect(store.rules).toHaveLength(1)
      expect(store.getRuleById('schema-name-required')).toEqual(updatedRule)
    })

    it('should remove rule', () => {
      // Add the rule first
      store.addRule({
        id: 'schema-name-required',
        name: 'Schema Name Required',
        fieldPath: 'schema.name',
        message: 'Schema name is required',
        severity: 'error',
        enabled: true,
        validator: mock(),
      })

      store.removeRule('schema-name-required')

      expect(store.rules).toHaveLength(0)
      expect(store.getRuleById('schema-name-required')).toBeUndefined()
    })

    it('should update rule properties', () => {
      // Add the rule first
      store.addRule({
        id: 'schema-name-required',
        name: 'Schema Name Required',
        fieldPath: 'schema.name',
        message: 'Schema name is required',
        severity: 'error',
        enabled: true,
        validator: mock(),
      })

      store.updateRule('schema-name-required', {
        name: 'Updated Schema Name Rule',
        message: 'Updated message',
        severity: 'warning',
        enabled: false,
      })

      const updatedRule = store.getRuleById('schema-name-required')
      expect(updatedRule?.name).toBe('Updated Schema Name Rule')
      expect(updatedRule?.message).toBe('Updated message')
      expect(updatedRule?.severity).toBe('warning')
      expect(updatedRule?.enabled).toBe(false)
    })

    it('should enable and disable rules', () => {
      // Add the rule first
      store.addRule({
        id: 'schema-name-required',
        name: 'Schema Name Required',
        fieldPath: 'schema.name',
        message: 'Schema name is required',
        severity: 'error',
        enabled: true,
        validator: mock(),
      })

      expect(store.enabledRules).toHaveLength(1)

      store.disableRule('schema-name-required')
      expect(store.enabledRules).toHaveLength(0)

      store.enableRule('schema-name-required')
      expect(store.enabledRules).toHaveLength(1)
    })

    it('should get rules by field path', () => {
      // Add the rule first
      store.addRule({
        id: 'schema-name-required',
        name: 'Schema Name Required',
        fieldPath: 'schema.name',
        message: 'Schema name is required',
        severity: 'error',
        enabled: true,
        validator: mock(),
      })

      const schemaNameRules = store.getRulesByFieldPath('schema.name')
      expect(schemaNameRules).toHaveLength(1)
      expect(schemaNameRules[0]?.id).toBe('schema-name-required')

      const nonExistentRules = store.getRulesByFieldPath('non.existent')
      expect(nonExistentRules).toHaveLength(0)
    })

    it('should only return enabled rules in queries', () => {
      // Add multiple rules first
      store.addRule({
        id: 'schema-name-required',
        name: 'Schema Name Required',
        fieldPath: 'schema.name',
        message: 'Schema name is required',
        severity: 'error',
        enabled: true,
        validator: mock(() => true),
      })

      store.addRule({
        id: 'wikibase-url-required',
        name: 'Wikibase URL Required',
        fieldPath: 'schema.wikibase',
        message: 'Wikibase URL is required',
        severity: 'error',
        enabled: true,
        validator: mock(),
      })

      store.addRule({
        id: 'labels-required',
        name: 'Labels Required',
        fieldPath: 'item.terms.labels',
        message: 'At least one label mapping is required',
        severity: 'error',
        enabled: true,
        validator: mock(),
      })

      store.addRule({
        id: 'statements-recommended',
        name: 'Statements Recommended',
        fieldPath: 'item.statements',
        message: 'Statement mappings are recommended for completeness',
        severity: 'warning',
        enabled: true,
        validator: mock(),
      })

      store.disableRule('schema-name-required')

      const schemaNameRules = store.getRulesByFieldPath('schema.name')
      expect(schemaNameRules).toHaveLength(0)

      expect(store.enabledRules).toHaveLength(3)
      expect(store.errorRules).toHaveLength(2)
    })
  })
  describe('clear functionality', () => {
    it('should clear all rules', () => {
      // Add a custom rule to the store
      store.addRule({
        id: 'custom-rule',
        name: 'Custom Rule',
        fieldPath: 'custom.field',
        message: 'Custom message',
        severity: 'error',
        enabled: true,
        validator: mock(),
      })

      expect(store.rules).toHaveLength(1) // 1 custom rule
      expect(store.enabledRules).toHaveLength(1) // 1 enabled custom rule

      // Clear all rules
      store.clearAllRules()

      expect(store.rules).toHaveLength(0)
      expect(store.enabledRules).toHaveLength(0)
      expect(store.getRuleById('custom-rule')).toBeUndefined()
    })
  })
})
