<script setup lang="ts">
// Use statement configuration composable
const {
  currentStatement,
  valueTypes,
  dataTypes,
  rankOptions,
  canSaveStatement,
  sourceLabel,
  sourcePlaceholder,
  sourceValue,
  resetStatement,
} = useStatementConfig()

// Property selection handler
const handlePropertySelection = (property: PropertyReference | null) => {
  currentStatement.value.property = property
}
</script>

<template>
  <div class="statement-config-editor space-y-6">
    <!-- Property Configuration Section -->
    <div class="border border-surface-200 rounded-lg p-4">
      <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
        <i class="pi pi-cog" />
        Property Configuration
      </h3>

      <div class="grid grid-cols-1 gap-4">
        <!-- Property Selection -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-surface-700">Property</label>
          <PropertySelector
            :model-value="currentStatement.property"
            placeholder="Search for a property..."
            @update="handlePropertySelection"
          />
        </div>
      </div>
    </div>

    <!-- Value Configuration Section -->
    <div class="border border-surface-200 rounded-lg p-4">
      <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
        <i class="pi pi-database" />
        Value Configuration
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Value Type -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-surface-700">Value Type</label>
          <Select
            v-model="currentStatement.value.type"
            :options="valueTypes"
            option-label="label"
            option-value="value"
            placeholder="Select type"
            class="w-full"
          />
        </div>

        <!-- Value Source -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-surface-700">
            {{ sourceLabel }}
          </label>
          <InputText
            v-model="sourceValue"
            :placeholder="sourcePlaceholder"
            class="w-full"
          />
        </div>

        <!-- Value Data Type -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-surface-700">Value Data Type</label>
          <Select
            v-model="currentStatement.value.dataType"
            :options="dataTypes"
            option-label="label"
            option-value="value"
            placeholder="Select data type"
            class="w-full"
          />
        </div>

        <!-- Statement Rank -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-surface-700">Statement Rank</label>
          <Select
            v-model="currentStatement.rank"
            :options="rankOptions"
            option-label="label"
            option-value="value"
            placeholder="Select rank"
            class="w-full"
          />
        </div>
      </div>
    </div>

    <!-- Auto-save Status -->
    <div class="border border-surface-200 rounded-lg p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <i class="pi pi-info-circle text-primary-500" />
          <span class="font-medium">Statement Configuration</span>
        </div>

        <div class="flex items-center gap-2">
          <div
            v-if="canSaveStatement"
            class="flex items-center gap-2 text-green-600"
          >
            <i class="pi pi-check-circle" />
            <span class="text-sm">Auto-saved to schema</span>
          </div>
          <div
            v-else
            class="flex items-center gap-2 text-gray-500"
          >
            <i class="pi pi-clock" />
            <span class="text-sm">Complete fields to auto-save</span>
          </div>
          <Button
            label="Reset"
            icon="pi pi-refresh"
            severity="secondary"
            outlined
            size="small"
            @click="resetStatement"
          />
        </div>
      </div>
    </div>
  </div>
</template>
