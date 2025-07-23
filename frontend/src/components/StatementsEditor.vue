<script setup lang="ts">
// Define emits
interface StatementsEditorEmits {
  'add-statement': []
  'edit-statement': [statementId: string]
  'remove-statement': [statementId: string]
  'reorder-statements': [fromIndex: number, toIndex: number]
}

const emit = defineEmits<StatementsEditorEmits>()

// Use schema store
const schemaStore = useSchemaStore()

// Computed properties
const statements = computed(() => schemaStore.statements)
const hasStatements = computed(() => statements.value.length > 0)

// Methods
const handleAddStatement = () => {
  emit('add-statement')
}

const handleEditStatement = (statementId: string) => {
  emit('edit-statement', statementId)
}

const handleRemoveStatement = (statementId: string) => {
  emit('remove-statement', statementId)
  schemaStore.removeStatement(statementId)
}

const handleReorderStatements = (fromIndex: number, toIndex: number) => {
  emit('reorder-statements', fromIndex, toIndex)
  // Note: Actual reordering logic would be implemented in the store
  // For now, we just emit the event
}

// Statement display formatting
const formatStatementDisplay = (statement: StatementSchemaMapping) => {
  const propertyLabel = statement.property.label || statement.property.id
  const valueSource =
    typeof statement.value.source === 'string'
      ? statement.value.source
      : statement.value.source.columnName
  const rankIndicator =
    statement.rank === 'preferred' ? '★' : statement.rank === 'deprecated' ? '⚠' : ''

  return `${propertyLabel}: ${valueSource} ${rankIndicator}`.trim()
}

const getRankSeverity = (rank: string) => {
  switch (rank) {
    case 'preferred':
      return 'success'
    case 'deprecated':
      return 'warn'
    default:
      return 'secondary'
  }
}

const getRankIcon = (rank: string) => {
  switch (rank) {
    case 'preferred':
      return 'pi pi-star-fill'
    case 'deprecated':
      return 'pi pi-exclamation-triangle'
    default:
      return 'pi pi-circle'
  }
}
</script>

<template>
  <div class="statements-editor space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold">Statements</h3>
      <Button
        icon="pi pi-plus"
        label="Add Statement"
        size="small"
        class="flex items-center gap-2"
        @click="handleAddStatement"
      />
    </div>

    <!-- Statements List -->
    <div
      v-if="hasStatements"
      class="space-y-3"
    >
      <div
        v-for="(statement, index) in statements"
        :key="statement.id"
        class="border border-surface-200 rounded-lg p-4 bg-surface-50"
      >
        <div class="flex items-center justify-between">
          <!-- Statement Display -->
          <div class="flex items-center gap-3 flex-1">
            <!-- Rank Indicator -->
            <div class="flex items-center gap-1">
              <i
                :class="getRankIcon(statement.rank)"
                class="text-sm"
                :style="{
                  color:
                    getRankSeverity(statement.rank) === 'success'
                      ? '#10b981'
                      : getRankSeverity(statement.rank) === 'warn'
                        ? '#f59e0b'
                        : '#6b7280',
                }"
              />
              <Chip
                :label="statement.rank"
                :severity="getRankSeverity(statement.rank)"
                size="small"
              />
            </div>

            <!-- Property and Value -->
            <div class="flex-1">
              <div class="font-medium text-surface-900">
                {{ statement.property.label || statement.property.id }}
              </div>
              <div class="text-sm text-surface-600">
                Property: {{ statement.property.id }} | Value:
                {{
                  typeof statement.value.source === 'string'
                    ? statement.value.source
                    : statement.value.source.columnName
                }}
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-2">
            <!-- Move Up -->
            <Button
              v-if="index > 0"
              icon="pi pi-chevron-up"
              size="small"
              severity="secondary"
              text
              @click="handleReorderStatements(index, index - 1)"
              v-tooltip="'Move up'"
            />

            <!-- Move Down -->
            <Button
              v-if="index < statements.length - 1"
              icon="pi pi-chevron-down"
              size="small"
              severity="secondary"
              text
              @click="handleReorderStatements(index, index + 1)"
              v-tooltip="'Move down'"
            />

            <!-- Edit -->
            <Button
              icon="pi pi-pencil"
              size="small"
              severity="secondary"
              text
              @click="handleEditStatement(statement.id)"
              v-tooltip="'Edit statement'"
            />

            <!-- Remove -->
            <Button
              icon="pi pi-trash"
              size="small"
              severity="danger"
              text
              @click="handleRemoveStatement(statement.id)"
              v-tooltip="'Remove statement'"
            />
          </div>
        </div>

        <!-- Additional Statement Info -->
        <div
          v-if="statement.qualifiers.length > 0 || statement.references.length > 0"
          class="mt-3 pt-3 border-t border-surface-200"
        >
          <div class="flex gap-4 text-sm text-surface-600">
            <span v-if="statement.qualifiers.length > 0">
              <i class="pi pi-tags mr-1" />
              {{ statement.qualifiers.length }} qualifier{{
                statement.qualifiers.length !== 1 ? 's' : ''
              }}
            </span>
            <span v-if="statement.references.length > 0">
              <i class="pi pi-bookmark mr-1" />
              {{ statement.references.length }} reference{{
                statement.references.length !== 1 ? 's' : ''
              }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="text-center py-8 text-surface-500"
    >
      <div class="text-4xl mb-2">
        <i class="pi pi-list" />
      </div>
      <div class="text-lg mb-2">No statements configured</div>
      <div class="text-sm">Click "Add Statement" to get started with property-value mappings.</div>
    </div>
  </div>
</template>
