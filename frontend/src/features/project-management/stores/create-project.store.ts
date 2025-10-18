export const useCreateProjectStore = defineStore('createProject', () => {
  const fileToUpload = ref<File>()
  const isCreating = ref(false)

  const setIsCreating = (value: boolean) => {
    isCreating.value = value
  }

  const setFileToUpload = (value: File | undefined) => {
    fileToUpload.value = value
  }

  return {
    // State
    fileToUpload,
    isCreating,

    // Actions
    setIsCreating,
    setFileToUpload,
  }
})
