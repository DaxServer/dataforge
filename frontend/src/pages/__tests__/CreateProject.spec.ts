import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CreateProject from '../CreateProject.vue'

// Mock the API client
vi.mock('@/api/client', () => ({
  api: {
    project: {
      post: vi.fn().mockResolvedValue({
        data: { id: 'test-project-id', name: 'Test Project' },
        error: null
      }),
      index: vi.fn((id: string) => ({
        import: {
          file: {
            post: vi.fn().mockResolvedValue({
              data: { success: true },
              error: null
            })
          },
          post: vi.fn().mockResolvedValue({
            data: { success: true },
            error: null
          })
        }
      }))
    }
  }
}))

// Mock vue-router
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}))

describe('CreateProject', () => {
  let wrapper: any
  
  beforeEach(() => {
    wrapper = mount(CreateProject)
  })

  it('should render project name input and file upload', () => {
    const projectNameInput = wrapper.find('input[type="text"]')
    const fileInput = wrapper.find('input[type="file"]')
    
    expect(projectNameInput.exists()).toBe(true)
    expect(fileInput.exists()).toBe(true)
  })

  it('should disable submit button when form is incomplete', () => {
    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.attributes('disabled')).toBeDefined()
  })

  it('should enable submit button when form is complete', async () => {
    // Set project name
    const projectNameInput = wrapper.find('input[type="text"]')
    await projectNameInput.setValue('Test Project')

    // Set file
    const fileInput = wrapper.find('input[type="file"]')
    const file = new File(['test content'], 'test.csv', { type: 'text/csv' })
    
    Object.defineProperty(fileInput.element, 'files', {
      value: [file],
      writable: false,
    })
    
    await fileInput.trigger('change')
    await wrapper.vm.$nextTick()

    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.attributes('disabled')).toBeUndefined()
  })

  it('should show selected file information', async () => {
    const fileInput = wrapper.find('input[type="file"]')
    const file = new File(['test content'], 'test.csv', { type: 'text/csv' })
    
    Object.defineProperty(fileInput.element, 'files', {
      value: [file],
      writable: false,
    })
    
    await fileInput.trigger('change')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('test.csv')
  })
})