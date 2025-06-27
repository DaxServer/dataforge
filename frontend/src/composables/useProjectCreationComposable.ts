export const useProjectCreationComposable = () => {
  const router = useRouter()
  const { setIsCreating } = useCreateProjectStore()
  const { showError } = useErrorHandling()

  const createProject = async (event: FileUploadUploaderEvent) => {
    const eventFiles = Array.isArray(event.files) ? event.files : [event.files]

    if (eventFiles.length === 0) {
      showError({
        data: [],
        errors: [{ code: 'VALIDATION', message: 'Please add files first.' }],
      })
      return
    }

    const fileToUpload = eventFiles[0]
    if (!fileToUpload) {
      showError({
        data: [],
        errors: [{ code: 'VALIDATION', message: 'No file selected for upload' }],
      })
      return
    }

    setIsCreating(true)

    const { data, error } = await api().project.import.post({
      file: fileToUpload,
    })

    setIsCreating(false)

    if (error) {
      showError(error.value)
      return
    }

    if (data?.data?.id) {
      setTimeout(() => {
        router.push(`/project/${data.data.id}`)
      }, 1000)
    } else {
      showError({
        data: [],
        errors: [
          {
            code: 'PROJECT_CREATION_FAILED',
            message: 'Failed to create project. Please try again.',
          },
        ],
      })
    }
  }

  return {
    createProject,
  }
}
