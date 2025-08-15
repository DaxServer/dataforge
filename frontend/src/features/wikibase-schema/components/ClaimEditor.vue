<script setup lang="ts">
// Props
interface Props {
  statement: StatementSchema
  statementIndex?: number
  disabled?: boolean
  showValidation?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  statementIndex: 1,
  disabled: false,
  showValidation: true,
})

// Store
const schemaStore = useSchemaStore()

// Rank options
const rankOptions = [
  { label: 'Preferred', value: 'preferred' as StatementRank, icon: 'pi pi-star-fill' },
  { label: 'Normal', value: 'normal' as StatementRank, icon: 'pi pi-circle' },
  { label: 'Deprecated', value: 'deprecated' as StatementRank, icon: 'pi pi-times-circle' },
]

// Methods
const handleValueChanged = (newValue: ValueMapping) => {
  schemaStore.updateStatementById(props.statement.id, 'value', newValue)
}

const handleRankChanged = (newRank: StatementRank) => {
  schemaStore.updateStatementById(props.statement.id, 'rank', newRank)
}
</script>

<template>
  <Card class="bg-white shadow-md border border-gray-200 rounded-lg overflow-hidden">
    <template #header>
      <div class="flex items-center gap-2 px-4 py-2 border-b bg-gray-50">
        <i class="pi pi-file-edit text-primary" />
        <span class="font-semibold">Statement {{ statementIndex }}</span>
      </div>
    </template>
    <template #content>
      <div class="space-y-3">
        <!-- Statement Rank -->
        <div class="space-y-1">
          <label class="block text-sm font-medium text-surface-700">Rank</label>
          <div class="flex gap-1">
            <Button
              v-for="option in rankOptions"
              :key="option.value"
              :label="option.label"
              :icon="option.icon"
              :severity="statement.rank === option.value ? 'primary' : 'secondary'"
              size="small"
              :disabled="disabled"
              @click="handleRankChanged(option.value)"
            />
          </div>
        </div>

        <!-- Value Configuration -->
        <ValueMappingEditor
          :value-mapping="statement.value"
          :property-data-type="statement.property?.dataType as WikibaseDataType"
          :disabled="disabled"
          @value-changed="handleValueChanged"
        />

        <!-- Qualifiers Section -->
        <div class="mt-4">
          <QualifiersEditor
            :statement-id="statement.id"
            :qualifiers="statement.qualifiers"
          />
        </div>

        <!-- References Section -->
        <div class="mt-4">
          <ReferencesEditor
            :statement-id="statement.id"
            :references="statement.references"
          />
        </div>
      </div>
    </template>
  </Card>
</template>
