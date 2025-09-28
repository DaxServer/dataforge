<script setup lang="ts">
const props = defineProps<{
  visible: boolean
  columnField: string
  columnHeader: string
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'replace-completed': [affectedRows: number]
}>()

const api = useApi()
const { showError } = useErrorHandling()
const projectId = useRouteParams('id') as Ref<UUID>

const findText = ref('')
const replaceText = ref('')
const caseSensitive = ref(false)
const wholeWord = ref(false)
const isLoading = ref(false)

const handleReplace = async () => {
  if (!findText.value) {
    return
  }

  isLoading.value = true

  try {
    const { data, error } = await api.project({ projectId: projectId.value }).replace.post({
      column: props.columnField,
      find: findText.value,
      replace: replaceText.value,
      caseSensitive: caseSensitive.value,
      wholeWord: wholeWord.value,
    })

    if (error) {
      showError(error.value as ExtendedError[])
      return
    }

    if (!data?.affectedRows) {
      showError([{ code: 'NOT_FOUND', message: 'Replace operation failed' }])
      return
    }

    if (data?.affectedRows !== undefined && data?.affectedRows !== null) {
      emit('replace-completed', data.affectedRows)
    }
  } catch (error) {
    console.error('Replace operation failed:', error)
  } finally {
    isLoading.value = false
    closeDialog()
  }
}

const closeDialog = () => {
  emit('update:visible', false)
  // Reset form
  findText.value = ''
  replaceText.value = ''
  caseSensitive.value = false
  wholeWord.value = false
}

const handleVisibleChange = (visible: boolean) => {
  emit('update:visible', visible)
  if (!visible) {
    // Reset form when dialog is closed
    findText.value = ''
    replaceText.value = ''
    caseSensitive.value = false
    wholeWord.value = false
  }
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    :header="`Replace in ${columnHeader}`"
    :style="{ width: '30vw' }"
    @update:visible="handleVisibleChange"
  >
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <label for="find-text" class="font-semibold">Find</label>
        <InputText
          id="find-text"
          v-model="findText"
          placeholder="Enter text to find"
          :disabled="isLoading"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label for="replace-text" class="font-semibold">Replace with</label>
        <InputText
          id="replace-text"
          v-model="replaceText"
          placeholder="Enter replacement text"
          :disabled="isLoading"
        />
      </div>

      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-2">
          <Checkbox
            id="case-sensitive"
            v-model="caseSensitive"
            binary
            :disabled="isLoading"
          />
          <label for="case-sensitive" class="cursor-pointer">Case sensitive</label>
        </div>

        <div class="flex items-center gap-2">
          <Checkbox
            id="whole-word"
            v-model="wholeWord"
            binary
            :disabled="isLoading"
          />
          <label for="whole-word" class="cursor-pointer">Whole word only</label>
        </div>
      </div>
    </div>

    <template #footer>
      <Button
        label="Cancel"
        icon="pi pi-times"
        text
        severity="secondary"
        :disabled="isLoading"
        @click="closeDialog"
      />
      <Button
        label="Replace"
        icon="pi pi-check"
        :loading="isLoading"
        :disabled="!findText"
        @click="handleReplace"
      />
    </template>
  </Dialog>
</template>
