<script setup lang="ts">
// Props
interface StatementPreviewProps {
  statement: {
    property: PropertyReference | null
    value: ValueMapping
    rank: StatementRank
  }
  qualifiers?: PropertyValueMap[]
  references?: ReferenceSchemaMapping[]
}

withDefaults(defineProps<StatementPreviewProps>(), {
  qualifiers: () => [],
  references: () => [],
})

// Rank options for severity mapping
const rankOptions = [
  { value: 'preferred', severity: 'success' },
  { value: 'normal', severity: 'info' },
  { value: 'deprecated', severity: 'warn' },
]
</script>

<template>
  <div class="border-t border-surface-200 pt-4">
    <h5 class="text-sm font-medium text-surface-700 mb-2">Preview</h5>
    <div class="bg-white border border-surface-200 rounded p-3 text-sm">
      <div class="flex items-center gap-2 mb-1">
        <Tag
          :value="statement.property?.id"
          size="small"
          severity="info"
        />
        <span class="font-medium">
          {{ statement.property?.label || statement.property?.id }}
        </span>
      </div>
      <div class="flex items-center gap-2 text-surface-600 ml-4">
        <i class="pi pi-arrow-right text-xs" />
        <Tag
          :value="
            statement.value.type === 'column'
              ? statement.value.source.columnName
              : statement.value.source
          "
          size="small"
          severity="secondary"
        />
        <span class="text-xs">{{ statement.value.dataType }}</span>
        <Tag
          :value="statement.rank"
          :severity="rankOptions.find((r) => r.value === statement.rank)?.severity"
          size="small"
        />
      </div>

      <!-- Qualifiers Preview -->
      <div
        v-if="qualifiers.length > 0"
        class="ml-8 mt-3 border-l-2 border-primary-200 pl-3 bg-gradient-to-r from-primary-25 to-transparent rounded-r"
        data-testid="qualifiers-preview"
      >
        <div class="text-xs text-primary-700 font-medium mb-2 flex items-center gap-1">
          <i class="pi pi-tags text-xs" />
          <span>Qualifiers ({{ qualifiers.length }}):</span>
        </div>
        <div class="space-y-2">
          <div
            v-for="(qualifier, index) in qualifiers"
            :key="`preview-qualifier-${index}`"
            class="flex items-center gap-2 text-xs text-surface-600 p-2 bg-white/50 rounded border border-primary-100"
            data-testid="qualifier-preview-item"
          >
            <div class="flex items-center gap-1 text-primary-600">
              <i class="pi pi-angle-right text-xs" />
              <span class="font-medium">Q{{ index + 1 }}</span>
            </div>
            <span class="font-medium">
              {{ qualifier.property.label || qualifier.property.id }}:
            </span>
            <Tag
              :value="
                qualifier.value.type === 'column'
                  ? qualifier.value.source.columnName
                  : qualifier.value.source
              "
              size="small"
              severity="secondary"
            />
            <span class="text-surface-400">{{ qualifier.value.dataType }}</span>
          </div>
        </div>
      </div>

      <!-- References Preview -->
      <div
        v-if="references.length > 0"
        class="ml-8 mt-3 border-l-2 border-orange-200 pl-3 bg-gradient-to-r from-orange-25 to-transparent rounded-r"
        data-testid="references-preview"
      >
        <div class="text-xs text-orange-700 font-medium mb-2 flex items-center gap-1">
          <i class="pi pi-bookmark text-xs" />
          <span>References ({{ references.length }}):</span>
        </div>
        <div class="space-y-3">
          <div
            v-for="(reference, refIndex) in references"
            :key="`preview-reference-${reference.id}`"
            class="p-2 bg-white/50 rounded border border-orange-100"
            data-testid="reference-preview-item"
          >
            <div class="flex items-center gap-1 text-orange-600 mb-2">
              <i class="pi pi-bookmark text-xs" />
              <span class="font-medium text-xs">R{{ refIndex + 1 }}</span>
              <span class="text-xs text-surface-500">
                ({{ reference.snaks.length }}
                {{ reference.snaks.length === 1 ? 'property' : 'properties' }})
              </span>
            </div>
            <div class="space-y-1 ml-3">
              <div
                v-for="(snak, snakIndex) in reference.snaks"
                :key="`preview-snak-${refIndex}-${snakIndex}`"
                class="flex items-center gap-2 text-xs text-surface-600"
                data-testid="reference-snak-preview-item"
              >
                <div class="flex items-center gap-1 text-orange-600">
                  <i class="pi pi-angle-right text-xs" />
                  <span class="font-medium">R{{ refIndex + 1 }}.{{ snakIndex + 1 }}</span>
                </div>
                <span class="font-medium">{{ snak.property.label || snak.property.id }}:</span>
                <Tag
                  :value="
                    snak.value.type === 'column' ? snak.value.source.columnName : snak.value.source
                  "
                  size="small"
                  severity="secondary"
                />
                <span class="text-surface-400">{{ snak.value.dataType }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
