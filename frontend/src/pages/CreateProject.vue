<script setup lang="ts">
const store = useCreateProjectStore()
const { message } = storeToRefs(store)

// Cleanup store state when component is unmounted
onUnmounted(() => {
  store.resetState()
})
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
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Upload Data File
              </label>
              <FileUpload
                name="file"
                accept=".json"
                customUpload
                @select="store.handleFileSelect"
                @remove="store.clearFile"
                @clear="store.clearFile"
                @uploader="store.createProject"
                :fileLimit=1
                :previewWidth=0
                :chooseButtonProps="{ severity: 'info' }"
              >
                <template #empty>
                  <div class="flex items-center justify-center flex-col p-6">
                    <i class="pi pi-cloud-upload border-1 rounded-full p-6 !text-4xl text-info" />
                    <p class="mt-6 mb-0 text-gray-600">Drag and drop files to here to upload.</p>
                    <p class="text-xs text-gray-500 mt-2">
                      JSON files only
                    </p>
                  </div>
                </template>
              </FileUpload>
            </div>
          </div>

          <!-- Status Messages -->
          <div v-if="message" class="mt-6">
            <Message
              :severity="message.type"
              :closable="true"
              @close="store.clearMessage"
            >
              {{ message.text }}
            </Message>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>
