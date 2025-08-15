<script setup lang="ts">
interface QualifiersEditorProps {
  statementId: UUID
  qualifiers?: PropertyValueMap[]
}

const props = withDefaults(defineProps<QualifiersEditorProps>(), {
  qualifiers: () => [],
})

const schemaStore = useSchemaStore()

// Methods
const addQualifier = () => {
  schemaStore.addNewQualifier(props.statementId)
}

const removeQualifier = (qualifierId: string) => {
  schemaStore.removeQualifier(props.statementId, qualifierId as UUID)
}

const handlePropertyChange = (qualifierId: string, property?: PropertyReference) => {
  schemaStore.updateQualifierProperty(props.statementId, qualifierId as UUID, property)
}

const handleValueChange = (qualifierId: string, value?: ValueMapping) => {
  schemaStore.updateQualifierValue(props.statementId, qualifierId as UUID, value)
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <i class="pi pi-tags text-primary" />
        <h4 class="font-medium text-surface-900">Qualifiers</h4>
        <span class="text-sm text-surface-600">
          ({{ qualifiers.length }} {{ qualifiers.length === 1 ? 'qualifier' : 'qualifiers' }})
        </span>
      </div>
      <Button
        label="Add Qualifier"
        icon="pi pi-plus"
        severity="secondary"
        size="small"
        @click="addQualifier"
      />
    </div>

    <div
      v-if="qualifiers.length > 0"
      class="space-y-3"
    >
      <div
        v-for="(qualifier, index) in qualifiers"
        :key="`qualifier-${qualifier.id}`"
        class="border border-surface-200 rounded-lg p-4 bg-surface-25"
      >
        <div class="flex items-center justify-between mb-3">
          <h5 class="font-medium text-surface-900">Qualifier {{ index + 1 }}</h5>
          <Button
            icon="pi pi-trash"
            severity="danger"
            size="small"
            text
            @click="removeQualifier(qualifier.id)"
          />
        </div>
        <PropertyValueMappingEditor
          :property-value-map="qualifier"
          :statement-id="statementId"
          context="qualifier"
          @property-changed="(p) => handlePropertyChange(qualifier.id, p)"
          @value-changed="(v) => handleValueChange(qualifier.id, v)"
        />
      </div>
    </div>
  </div>
</template>
