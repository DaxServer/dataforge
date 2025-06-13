export const useCreateProjectStore = defineStore('createProject', () => {
  const router = useRouter()
  const api = useApi()
  const selectedFile = ref<File | null>(null)
  const uploadedFiles = ref<File[]>([])
  const isCreating = ref(false)
  const message = ref<{ text: string; type: 'success' | 'error' | 'info' } | null>(null)

  const handleFileSelect = (event: any) => {
    if (event.files && event.files.length > 0) {
      selectedFile.value = event.files[0]
      message.value = null
    }
  }

  const clearFile = () => {
    selectedFile.value = null
  }

  const clearMessage = () => {
    message.value = null
  }

  const createProject = async () => {
    if (!selectedFile.value) {
      message.value = { text: 'Please select a file first.', type: 'error' }
      return
    }

    isCreating.value = true
    message.value = { text: 'Uploading...', type: 'info' }

    try {
      const { data, error } = await api.project.import.post({
        file: selectedFile.value,
      })

      if (data?.data?.id) {
        // Move file from selected to uploaded
        if (selectedFile.value) {
          uploadedFiles.value.push(selectedFile.value)
          selectedFile.value = null
        }
        clearMessage()
        // setTimeout(() => {
        //   router.push(`/projects/${data.data.id}`)
        // }, 1000)
      } else {
        message.value = { text: 'Failed to create project. Please try again.', type: 'error' }
      }
    } catch (error) {
      message.value = { text: 'An error occurred. Please try again.', type: 'error' }
    } finally {
      isCreating.value = false
    }
  }

  const resetState = () => {
    selectedFile.value = null
    uploadedFiles.value = []
    isCreating.value = false
    message.value = null
  }

  return {
    selectedFile,
    uploadedFiles,
    isCreating,
    message,
    handleFileSelect,
    clearFile,
    clearMessage,
    createProject,
    resetState
  }
})
