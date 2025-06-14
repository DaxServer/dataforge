export const useProjectCreationComposable = () => {
  const store = useCreateProjectStore()
  const { message, isCreating } = storeToRefs(store)

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

      const { data } = await api().project.import.post({
        file: fileToUpload,
      })

      if (data?.data?.id) {
        store.clearMessage()
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

  return {
    createProject,
  }
}
