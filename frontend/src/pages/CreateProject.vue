<script setup lang="ts">
const router = useRouter()
const api = useApi()
const selectedFile = ref<File | null>(null)
const isCreating = ref(false)
const message = ref<{ text: string; type: 'success' | 'error' | 'info' } | null>(null)

const handleFileSelect = (event: any) => {
  if (event.files && event.files.length > 0) {
    selectedFile.value = event.files[0]
    message.value = null
  }
}

const createProject = async () => {
  if (!selectedFile.value) {
    message.value = { text: 'Please select a file first.', type: 'error' }
    return
  }

  isCreating.value = true
  message.value = { text: '', type: 'info' }

  try {
    const { data, error } = await api.project.import.post({
      file: selectedFile.value,
    })

    if (data?.data?.id) {
      message.value = { text: 'Project created successfully!', type: 'success' }
      setTimeout(() => {
        router.push(`/projects/${data.data.id}`)
      }, 1000)
    } else {
      message.value = { text: 'Failed to create project. Please try again.', type: 'error' }
    }
  } catch (error) {
    message.value = { text: 'An error occurred. Please try again.', type: 'error' }
  } finally {
    isCreating.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-2xl mx-auto px-4">
      <Card class="shadow-md">
        <template #title>
          <h1 class="text-2xl font-bold text-gray-900">Create New Project</h1>
        </template>

        <template #content>
          <form @submit.prevent="createProject" class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Upload Data File
              </label>
              <FileUpload
                mode="basic"
                name="file"
                :auto="false"
                :choose-label="selectedFile ? 'Change File' : 'Choose File'"
                accept=".csv,.xlsx,.xls,.json,.tsv"
                @select="handleFileSelect"
                @clear="selectedFile = null"
                class="w-full"
              >
                <template #empty>
                  <div class="text-center p-6">
                    <i class="pi pi-cloud-upload text-4xl text-gray-400 mb-4"></i>
                    <p class="text-gray-600">Drag and drop files here or click to browse</p>
                    <p class="text-xs text-gray-500 mt-2">
                      CSV, Excel, JSON, TSV
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

            <div class="flex justify-end gap-3">
              <Button
                label="Cancel"
                severity="secondary"
                variant="outlined"
                @click="$router.push('/')"
              />
              <Button
                type="submit"
                label="Create Project"
                :disabled="!selectedFile || isCreating"
                :loading="isCreating"
                :loading-label="'Creating...'"
                icon="pi pi-plus"
              />
            </div>
          </form>

          <!-- Status Messages -->
          <div v-if="message" class="mt-6">
            <Message
              :severity="message.type === 'success' ? 'success' : 'error'"
              :closable="true"
              @close="message = null"
            >
              {{ message.text }}
            </Message>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>
