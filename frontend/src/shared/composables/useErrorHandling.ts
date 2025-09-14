export const useErrorHandling = () => {
  const toast = useToast()

  const showError = (errors: ExtendedError[]): void => {
    errors.forEach((error) => {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message,
        life: 5000,
      })
    })
  }

  const showSuccess = (text: string): void => {
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: text,
      life: 3000,
    })
  }

  const showInfo = (text: string): void => {
    toast.add({
      severity: 'info',
      summary: 'Info',
      detail: text,
      life: 3000,
    })
  }

  return {
    showError,
    showSuccess,
    showInfo,
  }
}
