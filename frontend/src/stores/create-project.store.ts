export const useCreateProjectStore = defineStore('createProject', () => {
  const api = useApi()

  const isCreating = ref(false)
  const message = ref<{ text: string; type: 'success' | 'error' | 'info' } | null>(null)

  // Simple getter functions for file display properties
  const getFileKey = (file: ProjectFile) => `${file.status}-${file.name}-${file.type}-${file.size}`

  const getContainerClass = (file: ProjectFile) =>
    file.status === 'pending'
      ? 'flex items-center justify-between p-4 border border-gray-200 rounded-lg'
      : 'flex items-center justify-between p-4 border border-green-200 bg-green-50 rounded-lg'

  const getIconClass = (file: ProjectFile) =>
    file.status === 'pending'
      ? 'pi pi-file text-2xl text-gray-500'
      : 'pi pi-file text-2xl text-green-600'

  const getBadgeValue = (file: ProjectFile) =>
    file.status === 'pending' ? (isCreating.value ? 'Uploading' : 'Pending') : 'Uploaded'

  const getBadgeSeverity = (file: ProjectFile) =>
    file.status === 'pending' ? (isCreating.value ? 'info' : 'secondary') : 'success'

  const handleFileSelect = (event: FileSelectEvent) => {
    if (event.files?.length) {
      message.value = null
    }
  }

  const clearMessage = () => {
    message.value = null
  }

  const createProject = async (event: FileUploadUploaderEvent) => {
    const eventFiles = Array.isArray(event.files) ? event.files : [event.files]

    if (eventFiles.length === 0) {
      message.value = { text: 'Please add files first.', type: 'error' }
      return
    }

    isCreating.value = true
    message.value = { text: 'Uploading...', type: 'info' }

    try {
      const fileToUpload = eventFiles[0]
      if (!fileToUpload) {
        throw new Error('No file selected for upload')
      }

      const { data } = await api.project.import.post({
        file: fileToUpload,
      })

      if (data?.data?.id) {
        clearMessage()
        // setTimeout(() => {
        //   router.push(`/projects/${data.data.id}`)
        // }, 1000)
      } else {
        message.value = { text: 'Failed to create project. Please try again.', type: 'error' }
      }
    } catch {
      message.value = { text: 'An error occurred. Please try again.', type: 'error' }
    } finally {
      isCreating.value = false
    }
  }

  const resetState = () => {
    isCreating.value = false
    message.value = null
  }

  return {
    isCreating,
    message,
    getFileKey,
    getContainerClass,
    getIconClass,
    getBadgeValue,
    getBadgeSeverity,
    handleFileSelect,
    clearMessage,
    createProject,
    resetState,
  }
})
