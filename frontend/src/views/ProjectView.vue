<script setup lang="ts">
const projectStore = useProjectStore()
const { meta, isLoading, data, columns } = storeToRefs(projectStore)
const { fetchProject } = projectStore
const { goBack } = useProjectActions()
const { linkifyText } = useLinkify()
const { replaceLineBreaks } = useLineBreak()

const projectId = useRouteParams('id')

onMounted(async () => {
  await fetchProject(projectId.value as string)
})
</script>

<template>
  <div>
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
    <div class="-m-6">
      <DataTable
        :value="data"
        :paginator="true"
        :rows="10"
        :rows-per-page-options="[5, 10, 25, 50]"
        table-class="text-sm"
        paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        paginator-position="top"
        current-page-report-template="Showing {first} to {last} of {totalRecords} rows"
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
              v-html="replaceLineBreaks(linkifyText(slotProps.data[col.field]))"
            ></span>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>
