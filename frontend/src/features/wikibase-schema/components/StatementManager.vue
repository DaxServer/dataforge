<script setup lang="ts">
// Store
const schemaStore = useSchemaStore()

// State for new statement creation
const isAddingStatement = ref(false)

// Computed properties
const statements = computed(() => schemaStore.statements)

// Methods
const handleAddStatement = () => {
  isAddingStatement.value = true
}

const handleReorderStatements = (fromIndex: number, toIndex: number) => {
  const statementsCopy = [...schemaStore.statements]
  const [movedStatement] = statementsCopy.splice(fromIndex, 1)

  if (movedStatement) {
    statementsCopy.splice(toIndex, 0, movedStatement)

    // Update the statements array in the store
    schemaStore.statements.splice(0, schemaStore.statements.length, ...statementsCopy)
    schemaStore.markDirty()
  }
}

const handleSaveNewStatement = (statement: Omit<StatementSchemaMapping, 'id'>) => {
  schemaStore.addStatement(
    statement.property,
    statement.value,
    statement.rank,
    statement.qualifiers,
    statement.references,
  )
  isAddingStatement.value = false
}

const handleCancelNewStatement = () => {
  isAddingStatement.value = false
}
</script>

<template>
  <div class="statements-list space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <i class="pi pi-list text-surface-600" />
        <h4 class="text-md font-medium text-surface-900">
          Statements
          <span
            v-if="statements.length > 0"
            class="text-sm text-surface-500 font-normal"
          >
            ({{ statements.length }})
          </span>
        </h4>
      </div>

      <Button
        icon="pi pi-plus"
        label="Add Statement"
        size="small"
        severity="primary"
        @click="handleAddStatement"
      />
    </div>

    <!-- Add New Statement Editor -->
    <div
      v-if="isAddingStatement"
      class="statement-editor p-4 border border-blue-200 rounded-lg bg-blue-50 shadow-sm"
    >
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-lg font-semibold text-surface-900">Add New Statement</h4>
      </div>

      <StatementEditor
        :is-new-statement="true"
        @save-new-statement="handleSaveNewStatement"
        @cancel-new-statement="handleCancelNewStatement"
      />
    </div>

    <!-- Statements List -->
    <div
      v-if="statements.length > 0"
      class="space-y-4"
    >
      <StatementEditor
        v-for="(statement, index) in statements"
        :key="statement.id"
        :statement="statement"
        :index="index"
        :can-move-up="index > 0"
        :can-move-down="index < statements.length - 1"
        @move-up="handleReorderStatements(index, index - 1)"
        @move-down="handleReorderStatements(index, index + 1)"
      />
    </div>

    <!-- Empty State -->
    <div
      v-if="statements.length === 0 && !isAddingStatement"
      class="text-center py-12 border-2 border-dashed border-slate-300 rounded-lg bg-slate-100"
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
