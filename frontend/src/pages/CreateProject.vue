<script setup lang="ts">
const router = useRouter()
const api = useApi()
const selectedFile = ref<File | null>(null)
const isCreating = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    selectedFile.value = input.files[0]
  }
}

const createProject = async () => {
  if (!selectedFile.value) {
    message.value = 'Please select a file to upload'
    messageType.value = 'error'
    return
  }

  isCreating.value = true
  message.value = ''

  try {
    // Use the single endpoint to create project with JSON file
    const response = await api.project.import.post({
      file: selectedFile.value,
    })

    if (response.error) {
      throw new Error('Failed to create project')
    }

    const projectId = response.data?.data.id
    if (!projectId) {
      throw new Error('No project ID returned')
    }

    message.value = 'Project created and file imported successfully!'
    messageType.value = 'success'

    // Redirect to project view after a short delay
    setTimeout(() => {
      router.push(`/project/${projectId}`)
    }, 2000)
  } catch (error) {
    console.error('Error creating project:', error)
    message.value =
      error instanceof Error ? error.message : 'Failed to create project. Please try again.'
    messageType.value = 'error'
  } finally {
    isCreating.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="border-b border-gray-200 pb-5">
      <h2 class="text-2xl font-semibold text-gray-900">Create Project</h2>
      <p class="mt-2 text-sm text-gray-600">Create a new OpenRefine project from your data.</p>
    </div>

    <div class="bg-white shadow sm:rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <form
          @submit.prevent="createProject"
          class="space-y-6"
        >
          <!-- File Upload Section -->
          <div>
            <label
              for="file-upload"
              class="block text-sm font-medium text-gray-700"
            >
              Data File
            </label>
            <div
              class="mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6"
            >
              <div class="space-y-1 text-center">
                <svg
                  class="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <div class="flex text-sm text-gray-600">
                  <label
                    for="file-upload"
                    class="relative cursor-pointer rounded-md bg-white font-medium text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:text-indigo-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      class="sr-only"
                      accept=".json"
                      @change="handleFileChange"
                      :disabled="isCreating"
                      required
                    />
                  </label>
                  <p class="pl-1">or drag and drop</p>
                </div>
                <p class="text-xs text-gray-500">JSON files up to 10MB</p>
              </div>
            </div>
          </div>

          <!-- Selected File Display -->
          <div
            v-if="selectedFile"
            class="rounded-md bg-gray-50 p-4"
          >
            <div class="flex items-center">
              <svg
                class="h-5 w-5 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                  clip-rule="evenodd"
                />
              </svg>
              <div class="ml-3 flex-1">
                <p class="text-sm font-medium text-gray-900">{{ selectedFile.name }}</p>
                <p class="text-sm text-gray-500">{{ Math.round(selectedFile.size / 1024) }} KB</p>
              </div>
            </div>
          </div>

          <!-- Status Message -->
          <div
            v-if="message"
            class="rounded-md p-4"
            :class="messageType === 'success' ? 'bg-green-50' : 'bg-red-50'"
          >
            <div class="flex">
              <div class="flex-shrink-0">
                <svg
                  v-if="messageType === 'success'"
                  class="h-5 w-5 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
                <svg
                  v-else
                  class="h-5 w-5 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div class="ml-3">
                <p
                  class="text-sm font-medium"
                  :class="messageType === 'success' ? 'text-green-800' : 'text-red-800'"
                >
                  {{ message }}
                </p>
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="flex justify-end">
            <button
              type="submit"
              class="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="isCreating || !selectedFile"
            >
              <svg
                v-if="isCreating"
                class="-ml-1 mr-2 h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {{ isCreating ? 'Creating Project...' : 'Create Project' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
