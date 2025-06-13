<script setup lang="ts">
const store = useCreateProjectStore()
const { selectedFile, isCreating, uploadedFiles } = storeToRefs(store)

// Cleanup store state when component is unmounted
onUnmounted(() => {
  store.resetState()
})

// Computed property to combine all files with their display properties
const allFiles = computed(() => {
  const result: Array<{
    key: string;
    file: File;
    containerClass: string;
    iconClass: string;
    badgeValue: string;
    badgeSeverity: string;
    type: 'pending' | 'uploaded';
  }> = [];

  // Add pending/uploading files
  if (selectedFile.value) {
    const file = selectedFile.value;
    result.push({
      key: `pending-${file.name}-${file.type}-${file.size}`,
      file, // file is now a File object
      containerClass: 'flex items-center justify-between p-4 border border-gray-200 rounded-lg',
      iconClass: 'pi pi-file text-2xl text-gray-500',
      badgeValue: isCreating.value ? 'Uploading' : 'Pending',
      badgeSeverity: isCreating.value ? 'info' : 'secondary',
      type: 'pending'
    });
  }

  // Add uploaded files
  uploadedFiles.value.forEach((file) => {
    result.push({
      key: `uploaded-${file.name}-${file.type}-${file.size}`,
      file,
      containerClass: 'flex items-center justify-between p-4 border border-green-200 bg-green-50 rounded-lg',
      iconClass: 'pi pi-file text-2xl text-green-600',
      badgeValue: 'Uploaded',
      badgeSeverity: 'success',
      type: 'uploaded'
    });
  });
  return result;
});

const handleRemove = (
  fileItem: { key: string; file: File; type: 'pending' | 'uploaded' },
  primeVueInternalFiles: File[], // Files from FileUpload slot is File[]
  primeVueRemoveFileCallback: (index: number) => void // Function from FileUpload slot
) => {
  if (fileItem.type === 'pending') {
    if (primeVueInternalFiles.length > 0) { // Simplified check
      const internalFileIndex = primeVueInternalFiles.findIndex(
        f => f.name === fileItem.file.name && f.size === fileItem.file.size && f.type === fileItem.file.type
      );
      if (internalFileIndex !== -1) {
        primeVueRemoveFileCallback(internalFileIndex); // This triggers @remove, then store.clearFile()
      } else {
        // Fallback if not found in component's list, but store might still have it
        if (selectedFile.value?.name === fileItem.file.name) {
          store.clearFile();
        }
        console.warn("Pending file not found in FileUpload's internal list for direct removal via callback.");
      }
    } else {
       // If primeVueInternalFiles is empty, but we are trying to remove a pending file from our list
       if (selectedFile.value?.name === fileItem.file.name) {
          store.clearFile(); // Clear from store as a fallback
       }
    }
  } else if (fileItem.type === 'uploaded') {
    const indexInUploadedFiles = uploadedFiles.value.findIndex(
      f => f.name === fileItem.file.name && f.size === fileItem.file.size && f.type === fileItem.file.type
    );
    if (indexInUploadedFiles !== -1) {
      uploadedFiles.value.splice(indexInUploadedFiles, 1);
    }
  }
};
</script>

<template>
  <div class="bg-gray-50 py-8">
    <div class="max-w-2xl mx-auto">
      <Card>
        <template #title>
          <h1 class="text-2xl font-bold text-gray-900">Create New Project</h1>
        </template>

        <template #content>
          <div class="">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Upload Data File
              </label>
              <FileUpload
                name="file"
                accept=".json"
                customUpload
                @select="store.handleFileSelect"
                @remove="store.clearFile"
                @clear="store.clearFile"
                @uploader="store.createProject"
                :fileLimit=1
                :previewWidth=0
                :chooseButtonProps="{ severity: 'info' }"
              >
                <template #empty>
                  <div v-if="!isCreating" class="flex items-center justify-center flex-col p-6">
                    <i class="pi pi-cloud-upload border-1 rounded-full p-6 !text-4xl text-info" />
                    <p class="mt-6 mb-0 text-gray-600">Drag and drop files to here to upload.</p>
                    <p class="text-xs text-gray-500 mt-2">
                      JSON files only
                    </p>
                  </div>
                </template>

                <template #content="{ files, removeFileCallback }">
                  <div class="flex flex-col gap-4 pt-4">
                    <div v-if="allFiles.length > 0">
                      <h5 class="text-lg font-semibold mb-3">Files</h5>
                      <div class="flex flex-col gap-3">
                        <div
                          v-for="(fileItem) of allFiles"
                          :key="fileItem.key"
                          :class="fileItem.containerClass"
                        >
                          <div class="flex items-center space-x-3">
                            <i :class="fileItem.iconClass" />
                            <div>
                              <p class="font-medium text-gray-900">{{ fileItem.file.name }}</p>
                              <p class="text-sm text-gray-500">{{ (fileItem.file.size / 1024 / 1024).toFixed(2) }} MB</p>
                            </div>
                          </div>
                          <div class="flex items-center space-x-3">
                            <Badge :value="fileItem.badgeValue" :severity="fileItem.badgeSeverity" />
                            <Button
                              icon="pi pi-times"
                              severity="danger"
                              text
                              rounded
                              @click="handleRemove(fileItem, files, removeFileCallback)"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </FileUpload>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>
