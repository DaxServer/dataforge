<script setup lang="ts">
// Create Project page logic will go here
</script>

<template>
  <div class="space-y-6">
    <div class="border-b border-gray-200 pb-5">
      <h2 class="text-2xl font-semibold text-gray-900">Create Project</h2>
      <p class="mt-2 text-sm text-gray-600">Create a new OpenRefine project from your data.</p>
    </div>

    <div class="bg-white shadow sm:rounded-lg">
      <div class="px-4 py-5 sm:p-6">
        <div class="text-center">
          <svg
            class="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">Create a new project</h3>
          <p class="mt-1 text-sm text-gray-500">
            Get started by creating a new project from your data.
          </p>
          <div class="mt-6">
            <button
              type="button"
              class="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <svg
                class="-ml-0.5 mr-1.5 h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"
                />
              </svg>
              Create Project
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
