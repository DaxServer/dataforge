<script setup lang="ts">
const projectId = useRouteParams('id')
const projectStore = useProjectStore()
const { meta, isLoading, data, columns, errorState } = storeToRefs(projectStore)
const { fetchProject } = projectStore
const { processHtml } = useHtml()

// Computed properties for template calculations
const totalRecords = computed(() => meta.value.total)

// Handle fetch requests from paginator
const handlePaginate = async (event: { offset: number; limit: number }) => {
  await fetchProject(projectId.value as string, event.offset, event.limit)
}

onUnmounted(async () => {
  projectStore.clearProject()
})
</script>

<template>
  <div>
    <!-- Error State -->
    <div
      v-if="errorState && !isLoading"
      class="flex items-center justify-center py-12"
    >
      <div class="text-center">
        <i class="pi pi-exclamation-triangle text-4xl text-red-500 mb-4"></i>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Error Loading Project</h3>
        <p class="text-gray-600 mb-4">{{ errorState }}</p>
      </div>
    </div>

    <!-- Project Data -->
    <div
      v-if="!errorState"
      class="-m-6"
    >
      <!-- Custom Pagination Controls -->
      <CustomPaginator
        :total-records="totalRecords"
        :initial-rows="5"
        @paginate="handlePaginate"
      />

      <DataTable
        :value="data"
        :paginator="false"
        :loading="isLoading"
        table-class="text-sm"
        striped-rows
        show-gridlines
        scrollable
        scrollHeight="flex"
      >
        <template #empty>
          <div class="text-center py-8">
            <i class="pi pi-info-circle text-4xl text-gray-400 mb-4"></i>
            <p class="text-gray-600">No data available in this project.</p>
          </div>
        </template>

        <Column
          v-for="col of columns"
          :key="col.field"
          :field="col.field"
          :header="col.header"
          :pt="{
            headerCell: { class: 'whitespace-nowrap !p-2 min-w-20' },
            bodyCell: {
              class: `${col.isDate ? 'whitespace-nowrap' : 'whitespace-normal break-words'} align-top !p-2 min-w-20 max-w-100 ${
                col.isInteger ? 'text-end!' : ''
              }`,
            },
          }"
        >
          <template #body="slotProps">
            <span
              :class="{
                'text-green-600 font-medium': col.isInteger,
              }"
              v-html="processHtml(slotProps.data[col.field])"
            ></span>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>
