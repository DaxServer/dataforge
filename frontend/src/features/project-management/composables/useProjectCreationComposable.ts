import type { ApiErrors } from '@backend/types/error-schemas'

export const useProjectCreationComposable = () => {
  const router = useRouter()
  const store = useCreateProjectStore()
  const { showError } = useErrorHandling()

  const createProject = async () => {
    if (!store.fileToUpload) {
      showError([
        {
          code: 'PROJECT_CREATION_FAILED',
          message: 'Please select a file to upload.',
        },
      ])
      return
    }

    store.setIsCreating(true)

    const { data, error } = await api().project.import.post({
      file: store.fileToUpload,
    })

    store.setIsCreating(false)
    store.setFileToUpload(undefined)

    if (error) {
      showError(error.value as ApiErrors)
      return
    }

    if (!data?.data?.id) {
      showError([
        {
          code: 'PROJECT_CREATION_FAILED',
          message: 'Failed to create project. Please try again.',
        },
      ])
      return
    }

    setTimeout(() => {
      router
        .push({
          name: 'ProjectView',
          params: { id: data.data.id, tab: 'data' },
        })
        .catch(() => {
          showError([
            {
              code: 'PROJECT_CREATION_FAILED',
              message: 'Failed to update URL.',
            },
          ])
        })
    }, 1000)
  }

  return {
    createProject,
  }
}
