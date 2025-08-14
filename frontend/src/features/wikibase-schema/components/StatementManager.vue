<script setup lang="ts">
// Store
const schemaStore = useSchemaStore()

// State for new statement creation
const isAddingStatement = ref(false)

// Methods
const handleAddStatement = () => {
  isAddingStatement.value = true
  schemaStore.addNewStatement()
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
            v-if="schemaStore.hasStatements"
            class="text-sm text-surface-500 font-normal"
          >
            ({{ schemaStore.countStatments }})
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
    <!-- <div
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
    </div> -->

    <!-- Statements List -->
    <div
      v-if="schemaStore.hasStatements"
      class="space-y-4"
    >
      <StatementEditor
        v-for="statement in schemaStore.statements1"
        :key="statement.id"
        :statement="statement"
        :index="1"
        :can-move-up="false"
        :can-move-down="false"
      />
    </div>

    <!-- Empty State -->
    <div
      v-if="!schemaStore.hasStatements && !isAddingStatement"
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
