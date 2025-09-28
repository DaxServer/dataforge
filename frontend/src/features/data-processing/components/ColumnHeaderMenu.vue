<script setup lang="ts">
const props = defineProps<{
  columnField: string
  columnHeader: string
  isPrimaryKey: boolean
}>()

const menu = ref()
const isOpen = ref(false)

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
            command: () => console.log(`Trim whitespace in ${props.columnHeader}`),
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
            command: () => console.log(`Transform ${props.columnHeader} to Uppercase`),
          },
          {
            label: 'To lowercase',
            command: () => console.log(`Transform ${props.columnHeader} to Lowercase`),
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
        command: () => console.log(`Replace in ${props.columnHeader}`),
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
  </div>
</template>
