<script setup lang="ts">
const projectStore = useProjectStore()
const { meta, isLoading, data, columns } = storeToRefs(projectStore)
const { fetchProject } = projectStore
const { goBack } = useProjectActions()

onMounted(async () => {
  await fetchProject(router.currentRoute.value.params.id as string)
})
</script>

<template>
  <div class="project-view">
    <div class="header border-b border-gray-200 -mx-6 px-6 pb-4 mb-6">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ meta?.name || 'Loading Project...' }}</h1>
          <p class="text-gray-600 mt-1">{{ meta?.total || 0 }} rows loaded</p>
        </div>
        <div class="flex gap-2">
          <Button
            label="Back to Projects"
            icon="pi pi-arrow-left"
            severity="secondary"
            outlined
            @click="goBack"
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="flex items-center justify-center py-12"
    >
      <ProgressSpinner />
    </div>

    <!-- Project Data -->
    <DataTable
      :value="data"
      :paginator="true"
      :rows="10"
      :rows-per-page-options="[5, 10, 25, 50]"
      table-class="text-sm"
      paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      current-page-report-template="Showing {first} to {last} of {totalRecords} rows"
      striped-rows
      show-gridlines
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
          headerCell: { class: 'w-10 overflow-auto !p-1' },
          bodyCell: { class: 'break-all align-top w-16 overflow-auto !p-1' },
        }"
      />
    </DataTable>
  </div>
</template>
