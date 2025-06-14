export const useCreateProjectStore = defineStore('createProject', () => {
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
    resetState,
  }
})
