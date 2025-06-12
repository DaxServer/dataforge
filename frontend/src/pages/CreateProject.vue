<script setup lang="ts">
const store = useCreateProjectStore()
const { selectedFile, isCreating, message } = storeToRefs(store)

// Cleanup store state when component is unmounted
onUnmounted(() => {
  store.resetState()
})

const handleAdvancedUpload = () => {
  store.createProject()
}
</script>

<template>
  <div class="bg-gray-50 py-8">
    <div class="max-w-2xl mx-auto">
      <Card>
        <template #title>
          <h1 class="text-2xl font-bold text-gray-900">Create New Project</h1>
        </template>

        <template #content>
          <div class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Upload Data File
              </label>
              <FileUpload
                name="file"
                :customUpload="true"
                @uploader="handleAdvancedUpload"
                :multiple="false"
                accept=".json"
                @select="store.handleFileSelect"
                @remove="store.clearFile"
                @clear="store.clearFile"
                class="w-full"
              >
                <template #empty>
                  <div class="flex items-center justify-center flex-col p-6">
                    <i class="pi pi-cloud-upload !border-2 !rounded-full !p-8 !text-4xl !text-muted-color" />
                    <p class="mt-6 mb-0 text-gray-600">Drag and drop files to here to upload.</p>
                    <p class="text-xs text-gray-500 mt-2">
                      JSON files only
                    </p>
                  </div>
                </template>
              </FileUpload>

              <div v-if="selectedFile" class="mt-3">
                <Message severity="info" :closable="false">
                  <template #icon>
                    <i class="pi pi-file"></i>
                  </template>
                  <div class="flex items-center justify-between w-full">
                    <span>{{ selectedFile.name }}</span>
                    <span class="text-xs">
                      {{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB
                    </span>
                  </div>
                </Message>
              </div>
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
