<script setup lang="ts">
const projectId = useRouteParams('id')
const projectStore = useProjectStore()
const { meta, isLoading, data, columns } = storeToRefs(projectStore)
const { fetchProject } = projectStore
const { processHtml } = useHtml()

// Computed properties for template calculations
const totalRecords = computed(() => meta.value.total)

// Handle fetch requests from paginator
const handlePaginate = async (event: { offset: number; limit: number }) => {
  await fetchProject(projectId.value as string, event.offset, event.limit)
}

onUnmounted(() => {
  projectStore.clearProject()
})
</script>

<template>
  <!-- Project Data -->
  <div class="-m-6 flex flex-col">
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
        :pt="{
          headerCell: {
            class: `whitespace-nowrap p-2! min-w-20 max-w-100 ${
              col.pk ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
            }`,
          },
          bodyCell: {
            class: `${col.isDate ? 'whitespace-nowrap' : 'whitespace-normal break-words'} align-top p-2! min-w-20 max-w-100 ${
              col.isInteger ? 'text-end!' : ''
            } ${col.pk ? 'bg-blue-25 border-l-4 border-l-blue-500' : ''}`,
          },
        }"
      >
        <template #header>
          <div class="flex items-center font-bold gap-2">
            <i
              v-if="col.pk"
              class="pi pi-key text-blue-600"
            ></i>
            <span>{{ col.header }}</span>
          </div>
        </template>
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
</template>
