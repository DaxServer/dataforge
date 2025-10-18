<script setup lang="ts">
import { LucideLoader2, LucidePlus } from 'lucide-vue-next'

const store = useCreateProjectStore()
const { createProject } = useProjectCreationComposable()

const fileInput = ref<HTMLInputElement>()

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    store.setFileToUpload(target.files[0])
  }
}
</script>

<template>
  <div class="bg-gray-50 py-8">
    <div class="max-w-2xl mx-auto">
      <Card>
        <template #title>
          <h3 class="text-2xl font-bold text-gray-900">Create New Project</h3>
        </template>

        <template #content>
            <Input ref="fileInput" id="file" type="file" accept=".json,.csv" :disabled="store.isCreating" @change="handleFileChange" />
            <Button
              :disabled="!store.fileToUpload || store.isCreating"
              type="submit"
              class="mt-4"
              @click="createProject"
            >
              <LucideLoader2 v-if="store.isCreating" class="animate-spin" />
              <LucidePlus v-else />
              Create Project
            </Button>
        </template>
      </Card>
    </div>
  </div>
</template>
