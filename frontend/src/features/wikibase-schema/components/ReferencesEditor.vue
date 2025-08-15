<script setup lang="ts">
interface ReferencesEditorProps {
  statementId: UUID
  references?: ReferenceSchemaMapping[]
}

const props = withDefaults(defineProps<ReferencesEditorProps>(), {
  references: () => [],
})

const schemaStore = useSchemaStore()

// Methods
const addReference = () => {
  schemaStore.addNewReference(props.statementId)
}

const removeReference = (referenceId: string) => {
  schemaStore.removeReference(props.statementId, referenceId as UUID)
}

const handlePropertyChange = (
  referenceId: string,
  snakId: string,
  property?: PropertyReference,
) => {
  schemaStore.updateReferenceProperty(
    props.statementId,
    referenceId as UUID,
    snakId as UUID,
    property,
  )
}

const handleValueChange = (referenceId: string, snakId: string, value?: ValueMapping) => {
  schemaStore.updateReferenceValue(props.statementId, referenceId as UUID, snakId as UUID, value)
}

const addSnakToReference = (referenceId: string) => {
  schemaStore.addSnakToReference(props.statementId, referenceId as UUID)
}

const removeSnakFromReference = (referenceId: string, snakId: string) => {
  schemaStore.removeSnakFromReference(props.statementId, referenceId as UUID, snakId as UUID)
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <i class="pi pi-bookmark text-primary" />
        <h4 class="font-medium text-surface-900">References</h4>
        <span class="text-sm text-surface-600">
          ({{ references.length }} {{ references.length === 1 ? 'reference' : 'references' }})
        </span>
      </div>
      <Button
        label="Add Reference"
        icon="pi pi-plus"
        severity="secondary"
        size="small"
        @click="addReference"
      />
    </div>

    <div
      v-if="references"
      class="space-y-3"
    >
      <div
        v-for="(reference, refIndex) in references"
        :key="`reference-${reference.id}`"
        class="border border-surface-200 rounded-lg p-4 bg-surface-25"
      >
        <div class="flex items-center justify-between mb-3">
          <h5 class="font-medium text-surface-900">Reference {{ refIndex + 1 }}</h5>
          <Button
            icon="pi pi-trash"
            severity="danger"
            size="small"
            text
            @click="removeReference(reference.id)"
          />
        </div>

        <!-- Reference Snaks -->
        <div class="space-y-3">
          <!-- Snaks Header -->
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-surface-700">
              Snaks ({{ reference.snaks.length }})
            </span>
            <Button
              label="Add Snak"
              icon="pi pi-plus"
              severity="secondary"
              size="small"
              text
              @click="addSnakToReference(reference.id)"
            />
          </div>

          <!-- Individual Snaks -->
          <div
            v-for="(snak, snakIndex) in reference.snaks"
            :key="`snak-${snak.id}`"
            class="border border-surface-100 rounded p-3 bg-white"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-surface-700">Snak {{ snakIndex + 1 }}</span>
              <Button
                icon="pi pi-times"
                severity="danger"
                size="small"
                text
                @click="removeSnakFromReference(reference.id, snak.id)"
              />
            </div>
            <PropertyValueMappingEditor
              :property-value-map="snak"
              :statement-id="statementId"
              context="reference"
              property-placeholder="Search for a reference property..."
              @property-changed="(p) => handlePropertyChange(reference.id, snak.id, p)"
              @value-changed="(v) => handleValueChange(reference.id, snak.id, v)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
