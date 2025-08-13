<script setup lang="ts">
// Props
interface ReferencesEditorProps {
  statementId: UUID
  references: ReferenceSchemaMapping[]
}

const props = defineProps<ReferencesEditorProps>()

// Store
const schemaStore = useSchemaStore()

// Local state
const isAddingReference = ref(false)
const isAddingSnakToReference = ref<number | null>(null) // Index of reference we're adding a snak to
const editingSnakInfo = ref<{ referenceIndex: number; snakIndex: number } | null>(null)

// Computed properties
const references = computed(() => props.references || [])

// Methods
const startAddingReference = () => {
  isAddingReference.value = true
  isAddingSnakToReference.value = null
  editingSnakInfo.value = null
}

const startAddingSnakToReference = (referenceIndex: number) => {
  isAddingSnakToReference.value = referenceIndex
  isAddingReference.value = false
  editingSnakInfo.value = null
}

const startEditingSnak = (referenceIndex: number, snakIndex: number) => {
  isAddingReference.value = false
  isAddingSnakToReference.value = null
  editingSnakInfo.value = { referenceIndex, snakIndex }
}

const cancelAddingReference = () => {
  isAddingReference.value = false
  isAddingSnakToReference.value = null
  editingSnakInfo.value = null
}

const handleSnakSave = (snak: PropertyValueMap) => {
  const statement = schemaStore.statements.find((s: any) => s.id === props.statementId)
  if (!statement) return

  if (isAddingReference.value) {
    // Create a new reference with the first snak
    const reference: ReferenceSchemaMapping = {
      id: crypto.randomUUID(),
      snaks: [snak],
    }
    const updatedReferences = [...statement.references, reference]
    schemaStore.updateStatement(
      props.statementId,
      statement.property,
      statement.value,
      statement.rank,
      statement.qualifiers,
      updatedReferences,
    )
  } else if (isAddingSnakToReference.value !== null) {
    // Add snak to existing reference
    const updatedReferences = [...statement.references]
    const currentReference = updatedReferences[isAddingSnakToReference.value]
    if (currentReference) {
      const updatedReference: ReferenceSchemaMapping = {
        id: currentReference.id || crypto.randomUUID(),
        snaks: [...(currentReference.snaks || []), snak],
      }
      updatedReferences[isAddingSnakToReference.value] = updatedReference
      schemaStore.updateStatement(
        props.statementId,
        statement.property,
        statement.value,
        statement.rank,
        statement.qualifiers || [],
        updatedReferences,
      )
    }
  } else if (editingSnakInfo.value !== null) {
    // Update existing snak
    const updatedReferences = [...statement.references]
    const currentReference = updatedReferences[editingSnakInfo.value.referenceIndex]
    if (currentReference) {
      const updatedReference: ReferenceSchemaMapping = {
        id: currentReference.id,
        snaks: currentReference.snaks.map((s, i) =>
          i === editingSnakInfo.value!.snakIndex ? snak : s,
        ),
      }
      updatedReferences[editingSnakInfo.value.referenceIndex] = updatedReference
      schemaStore.updateStatement(
        props.statementId,
        statement.property,
        statement.value,
        statement.rank,
        statement.qualifiers,
        updatedReferences,
      )
    }
  }

  cancelAddingReference()
}

const removeReference = (referenceIndex: number) => {
  const statement = schemaStore.statements.find((s: any) => s.id === props.statementId)
  if (statement) {
    const updatedReferences = statement.references.filter(
      (_: any, index: number) => index !== referenceIndex,
    )
    schemaStore.updateStatement(
      props.statementId,
      statement.property,
      statement.value,
      statement.rank,
      statement.qualifiers,
      updatedReferences,
    )
  }
}

const removeSnakFromReference = (referenceIndex: number, snakIndex: number) => {
  const statement = schemaStore.statements.find((s: any) => s.id === props.statementId)
  if (statement && statement.references && statement.references[referenceIndex]) {
    const updatedReferences = [...statement.references]
    const currentReference = updatedReferences[referenceIndex]
    if (currentReference) {
      const updatedReference: ReferenceSchemaMapping = {
        id: currentReference.id || crypto.randomUUID(),
        snaks: (currentReference.snaks || []).filter(
          (_: any, index: number) => index !== snakIndex,
        ),
      }
      updatedReferences[referenceIndex] = updatedReference
      schemaStore.updateStatement(
        props.statementId,
        statement.property,
        statement.value,
        statement.rank,
        statement.qualifiers || [],
        updatedReferences,
      )
    }
  }
}

const getPropertyDisplayText = (property: PropertyReference): string => {
  return property.label || property.id
}

const getValueDisplayText = (value: ValueMapping): string => {
  if (value.type === 'column') {
    return typeof value.source === 'string' ? value.source : value.source.columnName
  }
  return typeof value.source === 'string' ? value.source : 'No mapping'
}
</script>

<template>
  <div class="references-editor">
    <!-- Header with Add Button -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <i class="pi pi-bookmark text-surface-600 text-sm" />
        <span class="text-sm font-medium text-surface-900">
          References
          <span
            v-if="references.length > 0"
            class="text-xs text-surface-500 font-normal ml-1"
          >
            ({{ references.length }})
          </span>
        </span>
      </div>

      <Button
        v-if="!isAddingReference"
        icon="pi pi-plus"
        size="small"
        severity="secondary"
        text
        @click="startAddingReference"
      />
    </div>

    <!-- Existing References List -->
    <div
      v-if="references.length > 0"
      class="space-y-2"
      data-testid="references-list"
    >
      <!-- Individual References -->
      <div
        v-for="(reference, referenceIndex) in references"
        :key="`reference-${reference.id}`"
        class="border border-surface-200 rounded bg-surface-50"
        data-testid="reference-item"
      >
        <!-- Reference Header -->
        <div class="flex items-center justify-between p-2 border-b border-surface-200 bg-orange-50">
          <div class="flex items-center gap-2 text-sm font-medium text-orange-700">
            <i class="pi pi-bookmark text-xs" />
            <span>Reference {{ referenceIndex + 1 }}</span>
            <span class="text-xs text-surface-500 font-normal">
              ({{ reference.snaks.length }}
              {{ reference.snaks.length === 1 ? 'property' : 'properties' }})
            </span>
          </div>

          <div class="flex items-center gap-1">
            <Button
              v-tooltip="'Add property to this reference'"
              icon="pi pi-plus"
              size="small"
              severity="secondary"
              text
              @click="startAddingSnakToReference(referenceIndex)"
            />
            <Button
              v-tooltip="'Remove entire reference'"
              icon="pi pi-trash"
              size="small"
              severity="danger"
              text
              data-testid="remove-reference-button"
              @click="removeReference(referenceIndex)"
            />
          </div>
        </div>

        <!-- Reference Snaks (Property-Value Pairs) -->
        <div class="p-2 space-y-1">
          <div
            v-for="(snak, snakIndex) in reference.snaks"
            :key="`reference-${reference.id}-snak-${snakIndex}`"
            class="flex items-center justify-between p-2 bg-white border border-surface-200 rounded text-sm hover:bg-surface-50 transition-colors"
            data-testid="reference-snak"
          >
            <div class="flex items-center gap-2 flex-1">
              <!-- Property Info -->
              <Tag
                :value="snak.property.id"
                size="small"
                severity="info"
              />
              <span class="font-medium text-surface-900">
                {{ getPropertyDisplayText(snak.property) }}
              </span>

              <!-- Relationship Arrow -->
              <i class="pi pi-arrow-right text-surface-400 text-xs" />

              <!-- Value Info -->
              <Tag
                :value="getValueDisplayText(snak.value)"
                size="small"
                severity="secondary"
              />
            </div>

            <!-- Snak Actions -->
            <div class="flex items-center gap-1">
              <Button
                v-tooltip="'Edit this property'"
                icon="pi pi-pencil"
                size="small"
                severity="secondary"
                text
                data-testid="edit-snak-button"
                @click="startEditingSnak(referenceIndex, snakIndex)"
              />
              <Button
                v-tooltip="'Remove this property from reference'"
                icon="pi pi-times"
                size="small"
                severity="danger"
                text
                data-testid="remove-snak-button"
                @click="removeSnakFromReference(referenceIndex, snakIndex)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Reference -->
    <SingleReferenceEditor
      v-if="isAddingReference || isAddingSnakToReference !== null || editingSnakInfo !== null"
      :existing-snak="
        editingSnakInfo
          ? references[editingSnakInfo.referenceIndex]?.snaks[editingSnakInfo.snakIndex] || null
          : null
      "
      :is-editing="editingSnakInfo !== null"
      :is-adding-to-reference="isAddingSnakToReference !== null"
      @save="handleSnakSave"
      @cancel="cancelAddingReference"
    />
  </div>
</template>
