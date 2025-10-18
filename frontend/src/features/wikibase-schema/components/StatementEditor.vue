<script setup lang="ts">
import {
  LucideCheck,
  LucideChevronDown,
  LucideChevronUp,
  LucidePlus,
  LucideTrash,
  LucideX,
} from 'lucide-vue-next'

// Props
interface Props {
  statement: StatementSchema
  index?: number
  canMoveUp?: boolean
  canMoveDown?: boolean
  isNewStatement?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isNewStatement: false,
  index: 0,
  canMoveUp: false,
  canMoveDown: false,
})

const emit = defineEmits<{
  'move-up': []
  'move-down': []
  'validation-changed': [isValid: boolean, errors: string[]]
  'save-new-statement': [statement: Omit<StatementSchemaMapping, 'id'>]
  'cancel-new-statement': []
  'add-statement': []
}>()

// Store
const schemaStore = useSchemaStore()

// Local state for new statements
const localStatement = ref<{
  property: PropertyReference | null
  value: ValueMapping
  rank: StatementRank
  qualifiers: PropertyValueMap[]
  references: ReferenceSchemaMapping[]
}>({
  property: null,
  value: {
    type: 'column' as const,
    source: {
      columnName: '',
      dataType: 'VARCHAR' as const,
    },
    dataType: 'string' as const,
  } as ValueMapping,
  rank: 'normal' as StatementRank,
  qualifiers: [] as PropertyValueMap[],
  references: [] as ReferenceSchemaMapping[],
})

// Computed for current statement data
const currentStatement = computed(() => {
  return props.isNewStatement ? localStatement.value : props.statement
})

// Validation
const isValidStatement = computed(() => {
  return currentStatement.value.property !== null
})

// Event handlers
const handleSaveNewStatement = () => {
  if (props.isNewStatement && isValidStatement.value && localStatement.value.property) {
    emit('save-new-statement', {
      property: localStatement.value.property,
      value: localStatement.value.value,
      rank: localStatement.value.rank,
      qualifiers: localStatement.value.qualifiers,
      references: localStatement.value.references,
    })
  }
}

const handleCancelNewStatement = () => {
  if (props.isNewStatement) {
    emit('cancel-new-statement')
  }
}
</script>

<template>
  <div
    class="statement-editor space-y-4 p-4 border border-surface-200 rounded-lg"
    :class="index % 2 === 0 ? 'bg-white' : 'bg-slate-50'"
  >
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <!-- Move Up -->
        <Button
          v-if="canMoveUp"
          v-tooltip="'Move up'"
          size="sm"
          variant="secondary"
          @click="$emit('move-up')"
        >
          <LucideChevronUp />
        </Button>

        <!-- Move Down -->
        <Button
          v-if="canMoveDown"
          v-tooltip="'Move down'"
          size="sm"
          variant="secondary"
          @click="$emit('move-down')"
        >
          <LucideChevronDown />
        </Button>

        <!-- Remove -->
        <Button
          v-tooltip="'Remove statement'"
          size="sm"
          variant="destructive"
          @click="schemaStore.removeStatement1(statement.id)"
        >
          <LucideTrash />
        </Button>
      </div>
    </div>

    <!-- Property and Value Layout -->
    <div class="flex gap-6">
      <!-- Property Selection (Left) -->
      <div class="flex-0 space-y-2">
        <label class="block text-sm font-medium text-surface-700">
          Property
          <span class="text-red-500">*</span>
        </label>
        <PropertySelector
          :property="statement.property"
          placeholder="Search for a property..."
          @update="(p) => schemaStore.updateProperty(statement.id, p)"
        />
        <!-- Data Type Display -->
        <div
          v-if="statement.property"
          class="flex items-center gap-2 text-sm"
        >
          <i class="pi pi-info-circle" />
          <span class="text-surface-700 font-medium">
            {{ statement.property.dataType }}
          </span>
        </div>
      </div>

      <!-- Value Configuration with Rank (Right) -->
      <div class="flex-1 space-y-4">
        <ClaimEditor
          :statement="statement"
          :statement-index="(index || 0) + 1"
          :disabled="!statement.property"
        />

        <!-- Add New Statement Button -->
        <div v-if="!isNewStatement">
          <Button
            variant="outline"
            @click="$emit('add-statement')"
          >
            <LucidePlus />
            Add New Claim
          </Button>
        </div>
      </div>
    </div>

    <!-- New Statement Actions -->
    <div
      v-if="isNewStatement"
      class="flex justify-end gap-2 pt-4 border-t border-surface-200"
    >
      <Button
        variant="secondary"
        @click="handleCancelNewStatement"
      >
        <LucideX />
        Cancel
      </Button>
      <Button
        :disabled="!isValidStatement"
        @click="handleSaveNewStatement"
      >
        <LucideCheck />
        Save Statement
      </Button>
    </div>
  </div>
</template>
