<script setup lang="ts">
const { createProject } = useProjectCreationComposable()
const store = useCreateProjectStore()
const { isCreating } = storeToRefs(store)
</script>

<template>
  <div class="bg-gray-50 py-8">
    <div class="max-w-2xl mx-auto">
      <Card>
        <template #title>
          <h1 class="text-2xl font-bold text-gray-900">Create New Project</h1>
        </template>

        <template #content>
          <div class="">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Upload Data File</label>
              <FileUpload
                name="file"
                accept=".json"
                custom-upload
                :file-limit="1"
                :preview-width="0"
                :choose-button-props="{ severity: 'info' }"
                :cancel-button-props="{ severity: 'danger' }"
                @uploader="createProject($event)"
              >
                <template #empty>
                  <div
                    v-if="!isCreating"
                    class="flex items-center justify-center flex-col p-6"
                  >
                    <i class="pi pi-cloud-upload border-1 rounded-full p-6 !text-4xl text-info" />
                    <p class="mt-6 mb-0 text-gray-600">Drag and drop files to here to upload.</p>
                    <p class="text-xs text-gray-500 mt-2">JSON files only</p>
                  </div>
                </template>
              </FileUpload>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>
