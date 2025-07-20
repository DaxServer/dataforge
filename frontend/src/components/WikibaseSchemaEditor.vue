<script setup lang="ts"></script>

<template>
  <div class="flex gap-6">
    <!-- Column Palette -->
    <div class="w-80 flex-shrink-0">
      <ColumnPalette />
    </div>

    <!-- Schema Editor -->
    <div class="flex-1 bg-gray-50 rounded-lg shadow p-8 font-sans">
      <!-- Toolbar -->
      <div class="flex items-center justify-between mb-6">
        <span class="text-xl font-semibold">Wikibase schema</span>
        <div class="flex gap-2">
          <Button
            label="Add item"
            icon="pi pi-plus"
            outlined
            size="small"
          />
          <Button
            label="Preview"
            icon="pi pi-eye"
            outlined
            size="small"
          />
          <Button
            label="Help"
            icon="pi pi-question-circle"
            outlined
            size="small"
          />
        </div>
      </div>

      <!-- Schema Tree -->
      <div class="bg-white rounded-md p-6 shadow-sm">
        <div class="mb-6">
          <div class="flex items-center justify-between mb-2">
            <span class="font-medium text-lg">Item 1</span>
            <div class="flex gap-2">
              <Button
                icon="pi pi-pencil"
                rounded
                text
                size="small"
                aria-label="Edit item"
              />
              <Button
                icon="pi pi-trash"
                rounded
                text
                severity="danger"
                size="small"
                aria-label="Delete item"
              />
            </div>
          </div>
          <div class="pl-4 mb-2">
            <div class="mb-1">
              <span class="font-medium">Labels:</span>
              <span class="ml-2 text-gray-700">Q123 (Label in English)</span>
            </div>
            <div>
              <span class="font-medium">Descriptions:</span>
              <span class="ml-2 text-gray-700">A sample item description</span>
            </div>
          </div>
          <div class="pl-4">
            <div class="font-medium mb-1">Statements</div>
            <div class="flex items-center mb-1">
              <span class="text-blue-700 font-medium mr-2">P31 (instance of)</span>
              <span class="text-gray-800 mr-2">Q5 (human)</span>
              <Button
                icon="pi pi-pencil"
                rounded
                text
                size="small"
                aria-label="Edit statement"
              />
              <Button
                icon="pi pi-trash"
                rounded
                text
                severity="danger"
                size="small"
                aria-label="Delete statement"
              />
            </div>
            <div class="flex items-center mb-1">
              <span class="text-blue-700 font-medium mr-2">P21 (sex or gender)</span>
              <span class="text-gray-800 mr-2">Q6581097 (male)</span>
              <Button
                icon="pi pi-pencil"
                rounded
                text
                size="small"
                aria-label="Edit statement"
              />
              <Button
                icon="pi pi-trash"
                rounded
                text
                severity="danger"
                size="small"
                aria-label="Delete statement"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
