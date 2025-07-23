<script setup lang="ts">
// Define props
interface StatementsEditorProps {
  isAddingStatement?: boolean
}

defineProps<StatementsEditorProps>()

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

// Group statements by property for display
const statementsByProperty = computed(() => {
  const grouped = new Map<string, Array<(typeof statements.value)[0]>>()

  statements.value.forEach((statement) => {
    const propertyId = statement.property.id
    if (!grouped.has(propertyId)) {
      grouped.set(propertyId, [])
    }
    const group = grouped.get(propertyId)
    if (group) {
      group.push(statement)
    }
  })

  return grouped
})

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
      class="space-y-4"
    >
      <!-- Property Groups -->
      <div
        v-for="[propertyId, propertyStatements] in statementsByProperty"
        :key="propertyId"
        class="border border-surface-200 rounded-lg bg-surface-50"
      >
        <!-- Statements for this property -->
        <div
          v-for="(statement, index) in propertyStatements"
          :key="statement.id"
          class="border-b border-surface-200 last:border-b-0"
        >
          <!-- Main Statement -->
          <div class="p-4">
            <div class="flex items-start justify-between">
              <!-- Hierarchical Statement Display -->
              <div class="flex-1 space-y-2">
                <!-- Property-Value Relationship Header -->
                <div class="flex items-center gap-3">
                  <!-- Rank Indicator -->
                  <div class="flex items-center gap-2">
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
                    <Tag
                      :value="statement.rank"
                      :severity="getRankSeverity(statement.rank)"
                      size="small"
                    />
                  </div>

                  <!-- Property Label/ID -->
                  <div class="font-semibold text-surface-900 text-lg">
                    {{ statement.property.label || statement.property.id }}
                  </div>
                </div>

                <!-- Property-Value Relationship Details -->
                <div class="ml-6 space-y-1">
                  <div class="flex items-center gap-2 text-sm text-surface-600">
                    <span class="font-medium">Property:</span>
                    <Tag
                      :value="statement.property.id"
                      size="small"
                      severity="info"
                    />
                    <span class="text-surface-500">•</span>
                    <span>{{ statement.property.dataType }}</span>
                  </div>

                  <div class="flex items-center gap-2 text-sm text-surface-600">
                    <span class="font-medium">Value:</span>
                    <Tag
                      :value="
                        typeof statement.value.source === 'string'
                          ? statement.value.source
                          : statement.value.source.columnName
                      "
                      size="small"
                      severity="secondary"
                    />
                    <span class="text-surface-500">•</span>
                    <span>{{ statement.value.type }}</span>
                    <span class="text-surface-500">•</span>
                    <span>{{ statement.value.dataType }}</span>
                  </div>

                  <!-- Column Data Type (if column mapping) -->
                  <div
                    v-if="statement.value.type === 'column'"
                    class="flex items-center gap-2 text-sm text-surface-500 ml-4"
                  >
                    <i class="pi pi-database text-xs" />
                    <span>Column Type:</span>
                    <span class="font-mono">{{ (statement.value.source as any).dataType }}</span>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="flex items-center gap-2">
                  <!-- Move Up -->
                  <Button
                    v-if="index > 0"
                    v-tooltip="'Move up'"
                    icon="pi pi-chevron-up"
                    size="small"
                    severity="secondary"
                    text
                    @click="handleReorderStatements(index, index - 1)"
                  />

                  <!-- Move Down -->
                  <Button
                    v-if="index < statements.length - 1"
                    v-tooltip="'Move down'"
                    icon="pi pi-chevron-down"
                    size="small"
                    severity="secondary"
                    text
                    @click="handleReorderStatements(index, index + 1)"
                  />

                  <!-- Edit -->
                  <Button
                    v-tooltip="'Edit statement'"
                    icon="pi pi-pencil"
                    size="small"
                    severity="secondary"
                    text
                    @click="handleEditStatement(statement.id)"
                  />

                  <!-- Remove -->
                  <Button
                    v-tooltip="'Remove statement'"
                    icon="pi pi-trash"
                    size="small"
                    severity="danger"
                    text
                    @click="handleRemoveStatement(statement.id)"
                  />
                </div>
              </div>
            </div>

            <!-- Qualifiers and References Hierarchy -->
            <div
              v-if="statement.qualifiers.length > 0 || statement.references.length > 0"
              class="border-t border-surface-200 bg-surface-25"
            >
              <div class="p-4 space-y-3">
                <!-- Qualifiers Section -->
                <div
                  v-if="statement.qualifiers.length > 0"
                  class="space-y-2"
                >
                  <div class="flex items-center gap-2 text-sm font-medium text-surface-700">
                    <i class="pi pi-tags" />
                    <span>Qualifiers ({{ statement.qualifiers.length }})</span>
                  </div>
                  <div class="ml-6 space-y-1">
                    <div
                      v-for="(qualifier, qIndex) in statement.qualifiers"
                      :key="`${statement.id}-qualifier-${qIndex}`"
                      class="flex items-center gap-2 text-sm text-surface-600 py-1"
                    >
                      <i class="pi pi-angle-right text-xs text-surface-400" />
                      <span class="font-medium">
                        {{ qualifier.property.label || qualifier.property.id }}:
                      </span>
                      <Tag
                        :value="
                          typeof qualifier.value.source === 'string'
                            ? qualifier.value.source
                            : qualifier.value.source.columnName
                        "
                        size="small"
                        severity="secondary"
                      />
                      <span class="text-surface-400">{{ qualifier.value.dataType }}</span>
                    </div>
                  </div>
                </div>

                <!-- References Section -->
                <div
                  v-if="statement.references.length > 0"
                  class="space-y-2"
                >
                  <div class="flex items-center gap-2 text-sm font-medium text-surface-700">
                    <i class="pi pi-bookmark" />
                    <span>References ({{ statement.references.length }})</span>
                  </div>
                  <div class="ml-6 space-y-1">
                    <div
                      v-for="(reference, rIndex) in statement.references"
                      :key="`${statement.id}-reference-${rIndex}`"
                      class="flex items-center gap-2 text-sm text-surface-600 py-1"
                    >
                      <i class="pi pi-angle-right text-xs text-surface-400" />
                      <span class="font-medium">
                        {{ reference.property.label || reference.property.id }}:
                      </span>
                      <Tag
                        :value="
                          typeof reference.value.source === 'string'
                            ? reference.value.source
                            : reference.value.source.columnName
                        "
                        size="small"
                        severity="secondary"
                      />
                      <span class="text-surface-400">{{ reference.value.dataType }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="!hasStatements && !isAddingStatement"
      class="text-center py-12 border-2 border-dashed border-surface-200 rounded-lg bg-surface-25"
    >
      <div class="space-y-3">
        <div class="text-surface-400">
          <i class="pi pi-list text-4xl" />
        </div>
        <div class="space-y-1">
          <h4 class="text-lg font-medium text-surface-600">No statements configured</h4>
          <p class="text-surface-500">Add properties and values to define your item structure</p>
        </div>
      </div>
    </div>
  </div>
</template>
