import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CreateProject from '@frontend/pages/CreateProject.vue'
import { useApi } from '@frontend/plugins/api'

// Mock the API client manually
const mockApiPost = vi.fn().mockResolvedValue({
  data: { data: { id: 'test-project-id' } },
  error: null,
})

// Set up the mock on the imported api object
vi.spyOn(useApi().project.import, 'post').mockImplementation(mockApiPost)

// Mock router push function
const mockRouterPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}))

describe('CreateProject', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = mount(CreateProject)
  })

  it('should render file upload', () => {
    const fileInput = wrapper.find('input[type="file"]')
    expect(fileInput.exists()).toBe(true)
  })

  it('should disable submit button when form is incomplete', () => {
    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.attributes('disabled')).toBeDefined()
  })

  it('should enable submit button when file is selected', async () => {
    // Set file
    const fileInput = wrapper.find('input[type="file"]')
    const file = new File(['test content'], 'test.json', { type: 'application/json' })

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
    const file = new File(['test content'], 'test.json', { type: 'application/json' })

    Object.defineProperty(fileInput.element, 'files', {
      value: [file],
      writable: false,
    })

    await fileInput.trigger('change')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('test.json')
  })
})
