<script setup lang="ts">
const props = defineProps<{
  columnField: string
  columnHeader: string
  isPrimaryKey: boolean
}>()

const emit = defineEmits(['replaceCompleted'])

const { showSuccess, showWarning, showError } = useErrorHandling()
const api = useApi()

const menu = ref()
const isOpen = ref(false)
const showReplaceDialog = ref(false)
const projectId = useRouteParams('id') as Ref<UUID>

const handleReplaceCompleted = (affectedRows: number) => {
  if (affectedRows === 0) {
    showWarning('Replace completed: No rows were affected')
  } else {
    showSuccess(`Replace completed: ${affectedRows} rows affected`)
    emit('replaceCompleted')
  }
}

const handleTrimWhitespace = async () => {
  const { data, error } = await api.project({ projectId: projectId.value }).trim_whitespace.post({
    column: props.columnField,
  })

  if (error?.value) {
    showError(error.value as ExtendedError[])
    return
  }

  const affectedRows = data?.affectedRows || 0

  if (affectedRows === 0) {
    showWarning('Trim whitespace completed: No rows were affected')
  } else {
    showSuccess(`Trim whitespace completed: ${affectedRows} rows affected`)
    emit('replaceCompleted')
  }
}

const handleUpperCase = async () => {
  const { data, error } = await api.project({ projectId: projectId.value }).uppercase.post({
    column: props.columnField,
  })

  if (error?.value) {
    showError(error.value as ExtendedError[])
    return
  }

  const affectedRows = data?.affectedRows || 0

  if (affectedRows === 0) {
    showWarning('To uppercase completed: No rows were affected')
  } else {
    showSuccess(`To uppercase completed: ${affectedRows} rows affected`)
    emit('replaceCompleted')
  }
}

const handleLowerCase = async () => {
  const { data, error } = await api.project({ projectId: projectId.value }).lowercase.post({
    column: props.columnField,
  })

  if (error?.value) {
    showError(error.value as ExtendedError[])
    return
  }

  const affectedRows = data?.affectedRows || 0

  if (affectedRows === 0) {
    showWarning('To lowercase completed: No rows were affected')
  } else {
    showSuccess(`To lowercase completed: ${affectedRows} rows affected`)
    emit('replaceCompleted')
  }
}

const menuItems = ref<MenuItem[]>([
  {
    label: 'Sort',
    icon: 'pi pi-sort-amount-down',
    items: [
      {
        label: 'Ascending',
        icon: 'pi pi-sort-amount-up',
        command: () => console.log(`Sort ${props.columnHeader} Ascending`),
      },
      {
        label: 'Descending',
        icon: 'pi pi-sort-amount-down',
        command: () => console.log(`Sort ${props.columnHeader} Descending`),
      },
    ],
  },
  {
    separator: true,
  },
  {
    label: 'Filter',
    icon: 'pi pi-filter',
    command: () => console.log(`Filter ${props.columnHeader}`),
  },
  {
    label: 'Group By',
    icon: 'pi pi-objects-column',
    command: () => console.log(`Group By ${props.columnHeader}`),
  },
  {
    separator: true,
  },
  {
    label: 'Edit cells',
    icon: 'pi pi-code',
    items: [
      {
        label: 'Common transforms',
        icon: 'pi pi-text',
        items: [
          {
            label: 'Trim leading and trailing whitespace',
            command: handleTrimWhitespace,
          },
          {
            label: 'Collapse consecutive whitespace',
            command: () => console.log(`Collapse consecutive whitespace in ${props.columnHeader}`),
          },
          {
            separator: true,
          },
          {
            label: 'To uppercase',
            command: handleUpperCase,
          },
          {
            label: 'To lowercase',
            command: handleLowerCase,
          },
          {
            label: 'To titlecase',
            command: () => console.log(`Transform ${props.columnHeader} to Title Case`),
          },
        ],
      },
      {
        label: 'Replace',
        icon: 'pi pi-code',
        command: () => {
          showReplaceDialog.value = true
        },
      },
    ],
  },
])
</script>

<template>
  <div class="flex items-center">
    <Button
      v-if="!isPrimaryKey"
      type="button"
      icon="pi pi-chevron-down"
      class="p-button-rounded p-button-text p-button-sm"
      :aria-controls="`column-menu-${columnField}`"
      aria-haspopup="true"
      :aria-expanded="isOpen"
      @click="(event) => menu.toggle(event)"
    />
    <TieredMenu
      :id="`column-menu-${columnField}`"
      ref="menu"
      :model="menuItems"
      popup
      @show="() => (isOpen = true)"
      @hide="() => (isOpen = false)"
    />
    <ReplaceDialog
      :visible="showReplaceDialog"
      :column-field="columnField"
      :column-header="columnHeader"
      @update:visible="showReplaceDialog = $event"
      @replace-completed="handleReplaceCompleted"
    />
  </div>
</template>
