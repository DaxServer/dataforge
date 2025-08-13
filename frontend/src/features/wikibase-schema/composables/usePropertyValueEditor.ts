export interface PropertyValueEditorState {
  isAdding: Ref<boolean>
  editingIndex: Ref<number | null>
  selectedPropertyId: Ref<string>
  selectedValue: Ref<ValueMapping | null>
  validationErrors: Ref<string[]>
}

export interface PropertyValueEditorActions {
  startAdding: () => void
  startEditing: (index: number) => void
  cancelEditing: () => void
  handleSave: (item: PropertyValueMap) => void
  handleRemove: (index: number) => void
  onValidationChanged: (errors: string[]) => void
}

export interface PropertyValueEditorOptions {
  statementId: UUID
  items: ComputedRef<PropertyValueMap[]>
  onSave: (item: PropertyValueMap, editingIndex: number | null) => void
  onRemove: (index: number) => void
}

export const usePropertyValueEditor = () => {
  const { clearSelection } = usePropertySelection()

  // State
  const isAdding = ref(false)
  const editingIndex = ref<number | null>(null)
  const selectedPropertyId = ref('')
  const selectedValue = ref<ValueMapping | null>(null)
  const validationErrors = ref<string[]>([])

  // Computed
  const isFormValid = computed(() => {
    return selectedPropertyId.value && selectedValue.value && validationErrors.value.length === 0
  })

  const currentItem = computed(() => {
    return editingIndex.value !== null ? undefined : undefined
  })

  // Actions
  const startAdding = () => {
    isAdding.value = true
    editingIndex.value = null
    clearSelection()
    selectedPropertyId.value = ''
    selectedValue.value = null
  }

  const startEditing = (index: number) => {
    isAdding.value = true
    editingIndex.value = index
  }

  const cancelEditing = () => {
    isAdding.value = false
    editingIndex.value = null
    clearSelection()
    selectedPropertyId.value = ''
    selectedValue.value = null
  }

  const handleSave = (item: PropertyValueMap, items: PropertyValueMap[]) => {
    let updatedItems: PropertyValueMap[]
    if (editingIndex.value !== null) {
      updatedItems = [...items]
      updatedItems[editingIndex.value] = item
    } else {
      updatedItems = [...items, item]
    }
    cancelEditing()
    return updatedItems
  }

  const handleRemove = (index: number, items: PropertyValueMap[]) => {
    return items.filter((_, i) => i !== index)
  }

  const onValidationChanged = (_: any, errors: string[]) => {
    validationErrors.value = errors
  }

  return {
    // State
    isAdding: readonly(isAdding),
    editingIndex: readonly(editingIndex),
    selectedPropertyId,
    selectedValue,
    validationErrors: readonly(validationErrors),

    // Computed
    isFormValid,
    currentItem,

    // Actions
    startAdding,
    startEditing,
    cancelEditing,
    handleSave,
    handleRemove,
    onValidationChanged,
  }
}
