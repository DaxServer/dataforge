<script setup lang="ts">
// Props
interface Props {
  statement?: StatementSchemaMapping
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
  return props.isNewStatement ? localStatement.value : props.statement!
})

// Validation
const isValidStatement = computed(() => {
  return currentStatement.value.property !== null
})

// Event handlers
const handlePropertyChanged = (property: PropertyReference | null) => {
  if (props.isNewStatement) {
    localStatement.value.property = property
  } else if (property && props.statement) {
    schemaStore.updateStatement(
      props.statement.id as UUID,
      property,
      props.statement.value,
      props.statement.rank,
      props.statement.qualifiers,
      props.statement.references,
    )
  }
}

const handleValueChanged = (value: ValueMapping) => {
  if (props.isNewStatement) {
    localStatement.value.value = value
  } else if (props.statement) {
    schemaStore.updateStatement(
      props.statement.id as UUID,
      props.statement.property,
      value,
      props.statement.rank,
      props.statement.qualifiers,
      props.statement.references,
    )
  }
}

const handleRankChanged = (rank: StatementRank) => {
  if (props.isNewStatement) {
    localStatement.value.rank = rank
  } else if (props.statement) {
    schemaStore.updateStatement(
      props.statement.id as UUID,
      props.statement.property,
      props.statement.value,
      rank,
      props.statement.qualifiers,
      props.statement.references,
    )
  }
}

const handleQualifiersChanged = (qualifiers: PropertyValueMap[]) => {
  if (props.isNewStatement) {
    localStatement.value.qualifiers = qualifiers
  } else if (props.statement) {
    schemaStore.updateStatement(
      props.statement.id as UUID,
      props.statement.property,
      props.statement.value,
      props.statement.rank,
      qualifiers,
      props.statement.references,
    )
  }
}

const handleReferencesChanged = (references: ReferenceSchemaMapping[]) => {
  if (props.isNewStatement) {
    localStatement.value.references = references
  } else if (props.statement) {
    schemaStore.updateStatement(
      props.statement.id as UUID,
      props.statement.property,
      props.statement.value,
      props.statement.rank,
      props.statement.qualifiers,
      references,
    )
  }
}

const handleRemoveStatement = () => {
  if (props.statement) {
    schemaStore.removeStatement(props.statement.id as UUID)
  }
}

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
          icon="pi pi-chevron-up"
          size="small"
          severity="secondary"
          text
          @click="$emit('move-up')"
        />

        <!-- Move Down -->
        <Button
          v-if="canMoveDown"
          v-tooltip="'Move down'"
          icon="pi pi-chevron-down"
          size="small"
          severity="secondary"
          text
          @click="$emit('move-down')"
        />

        <!-- Remove -->
        <Button
          v-tooltip="'Remove statement'"
          icon="pi pi-trash"
          size="small"
          severity="danger"
          text
          @click="handleRemoveStatement"
        />
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
          :model-value="currentStatement.property"
          placeholder="Search for a property..."
          @update="handlePropertyChanged"
        />
        <!-- Data Type Display -->
        <div class="flex items-center gap-2 text-sm">
          <i class="pi pi-info-circle" />
          <span class="text-surface-700 font-medium">
            {{ currentStatement.property?.dataType }}
          </span>
        </div>
      </div>

      <!-- Value Configuration with Rank (Right) -->
      <div
        v-if="currentStatement.property"
        class="flex-1 space-y-4"
      >
        <ClaimEditor
          :value-mapping="currentStatement.value"
          :property="currentStatement.property"
          :rank="currentStatement.rank"
          :statement-id="!isNewStatement ? (statement!.id as UUID) : undefined"
          :statement-index="(index || 0) + 1"
          :qualifiers="currentStatement.qualifiers || []"
          :references="currentStatement.references || []"
          @value-changed="handleValueChanged"
          @rank-changed="handleRankChanged"
          @qualifiers-changed="handleQualifiersChanged"
          @references-changed="handleReferencesChanged"
        />

        <!-- Add New Statement Button -->
        <div v-if="!isNewStatement">
          <Button
            label="Add New Statement"
            icon="pi pi-plus"
            severity="secondary"
            outlined
            @click="$emit('add-statement')"
          />
        </div>
      </div>
    </div>

    <!-- New Statement Actions -->
    <div
      v-if="isNewStatement"
      class="flex justify-end gap-2 pt-4 border-t border-surface-200"
    >
      <Button
        label="Cancel"
        severity="secondary"
        @click="handleCancelNewStatement"
      />
      <Button
        label="Save Statement"
        :disabled="!isValidStatement"
        @click="handleSaveNewStatement"
      />
    </div>
  </div>
</template>
