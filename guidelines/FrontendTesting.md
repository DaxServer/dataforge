# Frontend Testing Guidelines

> **Note**: Frontend testing is currently **not implemented** in this project. These guidelines are preserved for future reference when frontend testing is added.

## Type Handling in Tests

**CRITICAL**: When frontend testing is implemented, follow these type guidelines:

- **NEVER create mock types or interfaces** for testing
- **ALWAYS use Elysia Eden inferred types** in test files
- Mock API responses should match backend schema exactly
- Use `import type { App } from '@backend'` for all type needs

### Example Test Type Usage

```typescript
// CORRECT - Use Elysia Eden types in tests
import type { App } from '@backend'

type User = Awaited<ReturnType<App['api']['users']['get']>>['data']
type CreateUserBody = Parameters<App['api']['users']['post']>[0]['body']

// Mock API response with correct types
const mockUser: User = {
  // Properties inferred from backend
}

// WRONG - Never create custom test types
// interface MockUser { id: string; name: string } // DON'T DO THIS
```

## Table of Contents
- [Vue Component Testing](#vue-component-testing)
- [Composables Testing](#composables-testing)
- [Store Testing](#store-testing)
- [E2E Testing](#e2e-testing)

## Vue Component Testing

### Setup
- Use Vue Test Utils for component testing
- Use Vitest as the test runner
- Store component tests in `frontend/tests/unit/components`

### Best Practices
- Test component behavior, not implementation details
- Use `mount` for full component testing
- Use `shallowMount` for isolated unit tests
- Mock external dependencies and API calls

### Example Component Test
```typescript
// frontend/tests/unit/components/ProjectCard.test.ts
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ProjectCard from '@/components/ProjectCard.vue'

describe('ProjectCard', () => {
  it('should display project name', () => {
    const wrapper = mount(ProjectCard, {
      props: {
        project: {
          id: '1',
          name: 'Test Project',
          description: 'Test Description'
        }
      }
    })
    
    expect(wrapper.text()).toContain('Test Project')
  })
  
  it('should emit delete event when delete button is clicked', async () => {
    const wrapper = mount(ProjectCard, {
      props: {
        project: {
          id: '1',
          name: 'Test Project',
          description: 'Test Description'
        }
      }
    })
    
    await wrapper.find('[data-testid="delete-button"]').trigger('click')
    
    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')[0]).toEqual(['1'])
  })
})
```

## Composables Testing

### Setup
- Test composables in isolation
- Store composable tests in `frontend/tests/unit/composables`
- Mock API calls and external dependencies

### Best Practices
- Test the reactive behavior of composables
- Test error handling
- Test cleanup and lifecycle management

### Example Composable Test
```typescript
// frontend/tests/unit/composables/useProjects.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useProjects } from '@/composables/useProjects'
import { api } from '@/composables/useApi'

// Mock the API
vi.mock('@/composables/useApi', () => ({
  api: {
    projects: {
      get: vi.fn()
    }
  }
}))

describe('useProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  it('should fetch projects successfully', async () => {
    const mockProjects = [
      { id: '1', name: 'Project 1' },
      { id: '2', name: 'Project 2' }
    ]
    
    vi.mocked(api.projects.get).mockResolvedValue({
      data: mockProjects,
      error: null,
      status: 200
    })
    
    const { projects, isLoading, error, fetchProjects } = useProjects()
    
    await fetchProjects()
    
    expect(projects.value).toEqual(mockProjects)
    expect(isLoading.value).toBe(false)
    expect(error.value).toBeNull()
  })
  
  it('should handle fetch errors', async () => {
    const mockError = new Error('Failed to fetch')
    
    vi.mocked(api.projects.get).mockResolvedValue({
      data: null,
      error: mockError,
      status: 500
    })
    
    const { projects, isLoading, error, fetchProjects } = useProjects()
    
    await fetchProjects()
    
    expect(projects.value).toEqual([])
    expect(isLoading.value).toBe(false)
    expect(error.value).toBe(mockError)
  })
})
```

## Store Testing

### Setup
- Test Pinia stores in isolation
- Store store tests in `frontend/tests/unit/stores`
- Mock API dependencies

### Best Practices
- Test store actions and state mutations
- Test error handling in stores
- Test store getters (if using computed properties)

### Example Store Test
```typescript
// frontend/tests/unit/stores/projects.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProjectsStore } from '@/stores/projects'
import { api } from '@/composables/useApi'

// Mock the API
vi.mock('@/composables/useApi', () => ({
  api: {
    projects: {
      get: vi.fn(),
      post: vi.fn()
    }
  }
}))

describe('Projects Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })
  
  it('should fetch projects', async () => {
    const store = useProjectsStore()
    const mockProjects = [
      { id: '1', name: 'Project 1' },
      { id: '2', name: 'Project 2' }
    ]
    
    vi.mocked(api.projects.get).mockResolvedValue({
      data: mockProjects,
      error: null,
      status: 200
    })
    
    await store.fetchProjects()
    
    expect(store.projects).toEqual(mockProjects)
    expect(store.isLoading).toBe(false)
    expect(store.error).toBeNull()
  })
  
  it('should create a project', async () => {
    const store = useProjectsStore()
    const newProject = { name: 'New Project', description: 'Description' }
    const createdProject = { id: '3', ...newProject }
    
    vi.mocked(api.projects.post).mockResolvedValue({
      data: createdProject,
      error: null,
      status: 201
    })
    
    const result = await store.createProject(newProject)
    
    expect(result.error).toBeNull()
    expect(result.data).toEqual(createdProject)
    expect(store.projects).toContain(createdProject)
  })
})
```

## E2E Testing

### Setup
- Use Playwright for E2E tests
- Store tests in `frontend/tests/e2e`
- Use page object model pattern

### Best Practices
- Test critical user flows
- Use data-testid attributes for reliable selectors
- Run tests in headless mode in CI
- Take screenshots on failure

### Example E2E Test
```typescript
// frontend/tests/e2e/projects.spec.ts
import { test, expect } from '@playwright/test'
import { ProjectsPage } from '../pages/projects-page'

test.describe('Projects', () => {
  test('should create a new project', async ({ page }) => {
    const projectsPage = new ProjectsPage(page)
    await projectsPage.goto()
    await projectsPage.createProject('My New Project')
    
    await expect(page.getByText('Project created successfully')).toBeVisible()
    await expect(page.getByText('My New Project')).toBeVisible()
  })
  
  test('should delete a project', async ({ page }) => {
    const projectsPage = new ProjectsPage(page)
    await projectsPage.goto()
    
    // Create a project first
    await projectsPage.createProject('Project to Delete')
    
    // Delete the project
    await projectsPage.deleteProject('Project to Delete')
    
    await expect(page.getByText('Project deleted successfully')).toBeVisible()
    await expect(page.getByText('Project to Delete')).not.toBeVisible()
  })
})
```

### Page Object Example
```typescript
// frontend/tests/e2e/pages/projects-page.ts
import { Page } from '@playwright/test'

export class ProjectsPage {
  constructor(private page: Page) {}
  
  async goto() {
    await this.page.goto('/projects')
  }
  
  async createProject(name: string) {
    await this.page.getByTestId('create-project-button').click()
    await this.page.getByTestId('project-name-input').fill(name)
    await this.page.getByTestId('save-project-button').click()
  }
  
  async deleteProject(name: string) {
    const projectRow = this.page.getByText(name).locator('..')
    await projectRow.getByTestId('delete-button').click()
    await this.page.getByTestId('confirm-delete-button').click()
  }
}
```

## Test Configuration

### Vitest Configuration
```typescript
// frontend/vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts']
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
})
```

### Test Setup
```typescript
// frontend/tests/setup.ts
import { config } from '@vue/test-utils'
import { createPinia } from 'pinia'

// Global test configuration
config.global.plugins = [createPinia()]

// Mock global objects if needed
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
```

## Running Frontend Tests

### Test Commands
```bash
# Run all frontend tests
bun --cwd frontend test

# Run tests in watch mode
bun --cwd frontend test --watch

# Run component tests only
bun --cwd frontend test tests/unit/components

# Run E2E tests
bun --cwd frontend test:e2e

# Generate coverage report
bun --cwd frontend test --coverage
```

### CI Integration
```yaml
# .github/workflows/test.yml (frontend section)
- name: Test Frontend
  run: |
    bun --cwd frontend test --coverage
    bun --cwd frontend test:e2e
```