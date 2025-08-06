<script setup lang="ts">
interface Props {
  onSchemaSelected: (schema: WikibaseSchemaMapping) => void
  onCreateNew: () => void
}

const props = defineProps<Props>()
const projectId = useRouteParams('id') as Ref<string>

// Composables
const { loadAllSchemas } = useSchemaApi()

// State
const schemas = ref<WikibaseSchemaMapping[]>([])
const isLoading = ref(false)

// Computed
const hasSchemas = computed(() => schemas.value.length > 0)

// Helper functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getSchemaCompletionInfo = (schema: WikibaseSchemaMapping) => {
  const { item } = schema
  const labelCount = Object.keys(item.terms.labels).length
  const descriptionCount = Object.keys(item.terms.descriptions).length
  const aliasCount = Object.keys(item.terms.aliases).length
  const statementCount = item.statements.length

  const totalTerms = labelCount + descriptionCount + aliasCount
  const isComplete = totalTerms > 0 && statementCount > 0

  return {
    labelCount,
    descriptionCount,
    aliasCount,
    statementCount,
    totalTerms,
    isComplete,
  }
}

// Actions
const handleSchemaClick = (schema: WikibaseSchemaMapping) => {
  props.onSchemaSelected(schema)
}

const handleCreateNew = () => {
  props.onCreateNew()
}

// Load schemas on mount
onMounted(async () => {
  isLoading.value = true
  try {
    schemas.value = await loadAllSchemas(projectId.value as UUID)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="schema-selector p-6">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-surface-900 mb-2">Select Schema</h2>
      <p class="text-surface-600">
        Choose an existing schema or create a new one to start mapping your data.
      </p>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading"
      data-testid="loading-indicator"
      class="flex items-center justify-center py-12"
    >
      <ProgressSpinner
        style="width: 50px; height: 50px"
        stroke-width="4"
        animation-duration="1s"
      />
      <span class="ml-3 text-surface-600">Loading schemas...</span>
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Create New Schema Button (Always Visible) -->
      <div class="mb-6">
        <Button
          data-testid="create-new-schema-btn"
          label="Create New Schema"
          icon="pi pi-plus"
          size="large"
          class="w-full"
          :disabled="isLoading"
          @click="handleCreateNew"
        />
      </div>

      <!-- Existing Schemas List -->
      <div v-if="hasSchemas">
        <h3 class="text-lg font-semibold text-surface-900 mb-4">Existing Schemas</h3>

        <div class="grid gap-4">
          <Card
            v-for="schema in schemas"
            :key="schema.id"
            data-testid="schema-item"
            class="cursor-pointer transition-all duration-200 hover:shadow-md border border-surface-200 hover:border-primary-300"
            @click="handleSchemaClick(schema)"
          >
            <template #content>
              <div class="p-4">
                <!-- Schema Name -->
                <h4 class="text-xl font-semibold text-surface-900 mb-2">
                  {{ schema.name }}
                </h4>

                <!-- Wikibase URL -->
                <p class="text-sm text-surface-600 mb-3">
                  <i class="pi pi-link mr-1"></i>
                  {{ schema.wikibase }}
                </p>

                <!-- Metadata Row -->
                <div class="flex items-center justify-between text-sm text-surface-500 mb-3">
                  <div class="flex items-center gap-4">
                    <span
                      :title="`Created: ${formatDateTime(schema.createdAt)}`"
                      class="cursor-help"
                    >
                      <i class="pi pi-calendar mr-1"></i>
                      Created {{ formatDate(schema.createdAt) }}
                    </span>
                    <span
                      :title="`Last modified: ${formatDateTime(schema.updatedAt)}`"
                      class="cursor-help"
                    >
                      <i class="pi pi-clock mr-1"></i>
                      Modified {{ formatDate(schema.updatedAt) }}
                    </span>
                  </div>
                </div>

                <!-- Completion Status -->
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Chip
                      :label="`${getSchemaCompletionInfo(schema).statementCount} statements`"
                      size="small"
                      :severity="
                        getSchemaCompletionInfo(schema).statementCount > 0 ? 'success' : 'secondary'
                      "
                      data-testid="statements-chip"
                    />
                    <Chip
                      :label="`${getSchemaCompletionInfo(schema).totalTerms} terms`"
                      size="small"
                      :severity="
                        getSchemaCompletionInfo(schema).totalTerms > 0 ? 'success' : 'secondary'
                      "
                      data-testid="terms-chip"
                    />
                  </div>

                  <div class="flex items-center gap-2">
                    <!-- Completion Status -->
                    <Chip
                      :label="
                        getSchemaCompletionInfo(schema).isComplete ? 'Complete' : 'Incomplete'
                      "
                      size="small"
                      :severity="getSchemaCompletionInfo(schema).isComplete ? 'success' : 'warning'"
                      data-testid="completion-chip"
                    />
                  </div>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else
        data-testid="empty-state"
        class="text-center py-12"
      >
        <div
          data-testid="empty-state-icon"
          class="mb-4"
        >
          <i class="pi pi-file-o text-6xl text-surface-300"></i>
        </div>

        <h3 class="text-xl font-semibold text-surface-700 mb-2">No schemas found</h3>

        <p class="text-surface-500 mb-6 max-w-md mx-auto">
          You haven't created any Wikibase schemas yet. Create your first schema to start mapping
          your data to Wikibase format.
        </p>
      </div>
    </div>
  </div>
</template>
