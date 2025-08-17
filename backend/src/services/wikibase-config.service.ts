import type { WikibaseInstanceConfig } from '@backend/types/wikibase-api'
import { ApiClient } from '@wmde/wikibase-rest-api'

/**
 * Validation result for instance configurations
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Connectivity test result for instance validation
 */
export interface ConnectivityResult {
  isConnected: boolean
  responseTime: number
  error?: string
  statusCode?: number
  apiVersion?: string
  features?: string[]
}

/**
 * Health check result for instance monitoring
 */
export interface HealthCheckResult {
  instanceId: string
  isHealthy: boolean
  lastChecked: Date
  responseTime: number
  error?: string
  details?: {
    apiVersion?: string
    features?: string[]
    rateLimit?: {
      remaining: number
      resetTime: Date
    }
  }
}

/**
 * Pre-defined Wikibase instance configurations
 */
const PREDEFINED_INSTANCES: WikibaseInstanceConfig[] = [
  {
    id: 'wikidata',
    name: 'Wikidata',
    baseUrl: 'https://www.wikidata.org/w/rest.php/wikibase/v1',
    userAgent: 'DataForge/0.1 (https://github.com/dataforge/dataforge)',
    isDefault: true,
    metadata: {
      description: 'The free knowledge base that anyone can edit',
      language: 'en',
      version: 'v0',
    },
  },
]

/**
 * Service for managing Wikibase instance configurations
 */
export class WikibaseConfigService {
  private instances: Map<string, WikibaseInstanceConfig> = new Map()
  private customInstances: Map<string, WikibaseInstanceConfig> = new Map()

  constructor() {
    // Initialize with pre-defined instances
    this.initializePredefinedInstances()
  }

  /**
   * Initialize pre-defined instance configurations
   */
  private initializePredefinedInstances(): void {
    for (const instance of PREDEFINED_INSTANCES) {
      this.instances.set(instance.id, { ...instance })
    }
  }

  /**
   * Get all available instances (pre-defined + custom)
   */
  async getInstances(): Promise<WikibaseInstanceConfig[]> {
    const allInstances = [
      ...Array.from(this.instances.values()),
      ...Array.from(this.customInstances.values()),
    ]

    // Sort by default status and name
    return allInstances.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1
      if (!a.isDefault && b.isDefault) return 1
      return a.name.localeCompare(b.name)
    })
  }

  /**
   * Get a specific instance by ID
   */
  async getInstance(instanceId: string): Promise<WikibaseInstanceConfig> {
    const instance = this.instances.get(instanceId) || this.customInstances.get(instanceId)

    if (!instance) {
      throw new Error(`Instance not found: ${instanceId}`)
    }

    return { ...instance }
  }

  /**
   * Add a new custom instance configuration
   */
  async addInstance(config: WikibaseInstanceConfig): Promise<void> {
    // Validate the configuration
    const validation = await this.validateInstance(config)
    if (!validation.isValid) {
      throw new Error(`Invalid instance configuration: ${validation.errors.join(', ')}`)
    }

    // Check if instance ID already exists
    if (this.instances.has(config.id) || this.customInstances.has(config.id)) {
      throw new Error(`Instance with ID '${config.id}' already exists`)
    }

    // Ensure it's not marked as default if we already have a default
    const hasDefault = await this.hasDefaultInstance()
    if (config.isDefault && hasDefault) {
      throw new Error('A default instance already exists. Remove the default flag from the existing instance first.')
    }

    // Store the custom instance
    this.customInstances.set(config.id, { ...config })
  }

  /**
   * Update an existing instance configuration
   */
  async updateInstance(instanceId: string, config: Partial<WikibaseInstanceConfig>): Promise<void> {
    const existingInstance = await this.getInstance(instanceId)
    const updatedConfig = { ...existingInstance, ...config, id: instanceId }

    // Validate the updated configuration
    const validation = await this.validateInstance(updatedConfig)
    if (!validation.isValid) {
      throw new Error(`Invalid instance configuration: ${validation.errors.join(', ')}`)
    }

    // Handle default instance logic
    if (config.isDefault === true) {
      const hasDefault = await this.hasDefaultInstance()
      if (hasDefault && !existingInstance.isDefault) {
        throw new Error('A default instance already exists. Remove the default flag from the existing instance first.')
      }
    }

    // Update the instance (custom instances only - predefined instances cannot be updated)
    if (this.customInstances.has(instanceId)) {
      this.customInstances.set(instanceId, updatedConfig)
    } else if (this.instances.has(instanceId)) {
      throw new Error('Cannot update pre-defined instance configurations')
    } else {
      throw new Error(`Instance not found: ${instanceId}`)
    }
  }

  /**
   * Remove a custom instance configuration
   */
  async removeInstance(instanceId: string): Promise<void> {
    // Cannot remove pre-defined instances
    if (this.instances.has(instanceId)) {
      throw new Error('Cannot remove pre-defined instance configurations')
    }

    if (!this.customInstances.has(instanceId)) {
      throw new Error(`Custom instance not found: ${instanceId}`)
    }

    this.customInstances.delete(instanceId)
  }

  /**
   * Validate an instance configuration
   */
  async validateInstance(config: WikibaseInstanceConfig): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    // Required field validation
    if (!config.id || typeof config.id !== 'string' || config.id.trim() === '') {
      errors.push('Instance ID is required and must be a non-empty string')
    }

    if (!config.name || typeof config.name !== 'string' || config.name.trim() === '') {
      errors.push('Instance name is required and must be a non-empty string')
    }

    if (!config.baseUrl || typeof config.baseUrl !== 'string' || config.baseUrl.trim() === '') {
      errors.push('Base URL is required and must be a non-empty string')
    }

    if (!config.userAgent || typeof config.userAgent !== 'string' || config.userAgent.trim() === '') {
      errors.push('User agent is required and must be a non-empty string')
    }

    // URL format validation
    if (config.baseUrl) {
      try {
        const url = new URL(config.baseUrl)
        if (!['http:', 'https:'].includes(url.protocol)) {
          errors.push('Base URL must use HTTP or HTTPS protocol')
        }
      } catch {
        errors.push('Base URL must be a valid URL')
      }
    }

    // ID format validation
    if (config.id) {
      const idPattern = /^[a-z0-9-_]+$/
      if (!idPattern.test(config.id)) {
        errors.push('Instance ID must contain only lowercase letters, numbers, hyphens, and underscores')
      }

      if (config.id.length > 50) {
        errors.push('Instance ID must be 50 characters or less')
      }
    }

    // Name length validation
    if (config.name && config.name.length > 100) {
      errors.push('Instance name must be 100 characters or less')
    }

    // User agent validation
    if (config.userAgent && config.userAgent.length > 200) {
      errors.push('User agent must be 200 characters or less')
    }

    // Auth token validation
    if (config.authToken !== undefined) {
      if (typeof config.authToken !== 'string') {
        errors.push('Auth token must be a string')
      } else if (config.authToken.trim() === '') {
        warnings.push('Auth token is empty - authentication will not be used')
      }
    }

    // Metadata validation
    if (config.metadata) {
      if (typeof config.metadata !== 'object' || Array.isArray(config.metadata)) {
        errors.push('Metadata must be an object')
      } else {
        if (config.metadata.description && typeof config.metadata.description !== 'string') {
          errors.push('Metadata description must be a string')
        }
        if (config.metadata.language && typeof config.metadata.language !== 'string') {
          errors.push('Metadata language must be a string')
        }
        if (config.metadata.version && typeof config.metadata.version !== 'string') {
          errors.push('Metadata version must be a string')
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Get the default instance
   */
  async getDefaultInstance(): Promise<WikibaseInstanceConfig | null> {
    const instances = await this.getInstances()
    return instances.find(instance => instance.isDefault) || null
  }

  /**
   * Set an instance as the default
   */
  async setDefaultInstance(instanceId: string): Promise<void> {
    const instance = await this.getInstance(instanceId)

    // Remove default flag from all instances
    await this.clearDefaultInstance()

    // Set the new default
    const updatedConfig = { ...instance, isDefault: true }

    if (this.customInstances.has(instanceId)) {
      this.customInstances.set(instanceId, updatedConfig)
    } else if (this.instances.has(instanceId)) {
      this.instances.set(instanceId, updatedConfig)
    }
  }

  /**
   * Clear the default instance flag from all instances
   */
  async clearDefaultInstance(): Promise<void> {
    // Clear from pre-defined instances
    for (const [id, instance] of this.instances.entries()) {
      if (instance.isDefault) {
        this.instances.set(id, { ...instance, isDefault: false })
      }
    }

    // Clear from custom instances
    for (const [id, instance] of this.customInstances.entries()) {
      if (instance.isDefault) {
        this.customInstances.set(id, { ...instance, isDefault: false })
      }
    }
  }

  /**
   * Check if there's already a default instance
   */
  private async hasDefaultInstance(): Promise<boolean> {
    const instances = await this.getInstances()
    return instances.some(instance => instance.isDefault)
  }

  /**
   * Get pre-defined instance configurations
   */
  async getPredefinedInstances(): Promise<WikibaseInstanceConfig[]> {
    return Array.from(this.instances.values())
  }

  /**
   * Get custom instance configurations
   */
  async getCustomInstances(): Promise<WikibaseInstanceConfig[]> {
    return Array.from(this.customInstances.values())
  }

  /**
   * Check if an instance is pre-defined
   */
  isPredefinedInstance(instanceId: string): boolean {
    return this.instances.has(instanceId)
  }

  /**
   * Check if an instance is custom
   */
  isCustomInstance(instanceId: string): boolean {
    return this.customInstances.has(instanceId)
  }

  /**
   * Reset to default configuration (remove all custom instances, restore pre-defined)
   */
  async resetToDefaults(): Promise<void> {
    this.customInstances.clear()
    this.instances.clear()
    this.initializePredefinedInstances()
  }

  /**
   * Test connectivity to a Wikibase instance
   */
  async testConnectivity(config: WikibaseInstanceConfig): Promise<ConnectivityResult> {
    const startTime = Date.now()

    try {
      // Create a temporary API client for testing
      const apiClient = new ApiClient(config.baseUrl)

      // Configure authentication if provided
      if (config.authToken) {
        apiClient.defaultHeaders = {
          ...(apiClient.defaultHeaders ?? {}),
          Authorization: `Bearer ${config.authToken}`,
        }
      }

      // Set user agent
      apiClient.defaultHeaders = {
        ...(apiClient.defaultHeaders ?? {}),
        'User-Agent': config.userAgent,
      }

      // Test connectivity by making a simple API call
      // We'll try to get the OpenAPI spec or make a simple request
      const response = await this.makeTestRequest(apiClient)
      const responseTime = Date.now() - startTime

      return {
        isConnected: true,
        responseTime,
        statusCode: response.status,
        apiVersion: response.apiVersion,
        features: response.features,
      }
    } catch (error) {
      const responseTime = Date.now() - startTime

      return {
        isConnected: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown connectivity error',
        statusCode: this.extractStatusCode(error),
      }
    }
  }

  /**
   * Perform a health check on a configured instance
   */
  async performHealthCheck(instanceId: string): Promise<HealthCheckResult> {
    const startTime = Date.now()

    try {
      const config = await this.getInstance(instanceId)
      const connectivityResult = await this.testConnectivity(config)

      const healthResult: HealthCheckResult = {
        instanceId,
        isHealthy: connectivityResult.isConnected,
        lastChecked: new Date(),
        responseTime: connectivityResult.responseTime,
      }

      if (!connectivityResult.isConnected) {
        healthResult.error = connectivityResult.error
      } else {
        healthResult.details = {
          apiVersion: connectivityResult.apiVersion,
          features: connectivityResult.features,
        }
      }

      return healthResult
    } catch (error) {
      const responseTime = Date.now() - startTime

      return {
        instanceId,
        isHealthy: false,
        lastChecked: new Date(),
        responseTime,
        error: error instanceof Error ? error.message : 'Health check failed',
      }
    }
  }

  /**
   * Validate instance configuration including connectivity test
   */
  async validateInstanceWithConnectivity(config: WikibaseInstanceConfig): Promise<ValidationResult & { connectivity?: ConnectivityResult }> {
    // First perform basic validation
    const basicValidation = await this.validateInstance(config)

    if (!basicValidation.isValid) {
      return basicValidation
    }

    // If basic validation passes, test connectivity
    try {
      const connectivityResult = await this.testConnectivity(config)

      if (!connectivityResult.isConnected) {
        return {
          isValid: false,
          errors: [...basicValidation.errors, `Connectivity test failed: ${connectivityResult.error}`],
          warnings: basicValidation.warnings,
          connectivity: connectivityResult,
        }
      }

      return {
        ...basicValidation,
        connectivity: connectivityResult,
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [...basicValidation.errors, `Connectivity test error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: basicValidation.warnings,
      }
    }
  }

  /**
   * Make a test request to verify API connectivity
   */
  private async makeTestRequest(apiClient: ApiClient): Promise<{
    status: number
    apiVersion?: string
    features?: string[]
  }> {
    try {
      // Try to make a simple request to test the API
      // We'll use a lightweight endpoint that should be available on most Wikibase instances

      // First, try to get the OpenAPI specification
      const response = await fetch(`${apiClient.basePath}/openapi.json`, {
        method: 'GET',
        headers: apiClient.defaultHeaders,
      })

      if (response.ok) {
        const openApiSpec = await response.json() as any
        return {
          status: response.status,
          apiVersion: openApiSpec.info?.version || 'unknown',
          features: this.extractFeaturesFromOpenApi(openApiSpec),
        }
      }

      // If OpenAPI spec is not available, try a simple GET request to the base path
      const baseResponse = await fetch(apiClient.basePath, {
        method: 'GET',
        headers: apiClient.defaultHeaders,
      })

      return {
        status: baseResponse.status,
        apiVersion: 'unknown',
        features: [],
      }
    } catch (error) {
      // If all else fails, throw the error to be handled by the caller
      throw error
    }
  }

  /**
   * Extract available features from OpenAPI specification
   */
  private extractFeaturesFromOpenApi(openApiSpec: any): string[] {
    const features: string[] = []

    try {
      if (openApiSpec.paths) {
        const paths = Object.keys(openApiSpec.paths)

        // Check for common Wikibase API features
        if (paths.some(path => path.includes('/entities/items'))) {
          features.push('items')
        }
        if (paths.some(path => path.includes('/entities/properties'))) {
          features.push('properties')
        }
        if (paths.some(path => path.includes('/search'))) {
          features.push('search')
        }
        if (paths.some(path => path.includes('/statements'))) {
          features.push('statements')
        }
        if (paths.some(path => path.includes('/labels'))) {
          features.push('labels')
        }
        if (paths.some(path => path.includes('/descriptions'))) {
          features.push('descriptions')
        }
        if (paths.some(path => path.includes('/aliases'))) {
          features.push('aliases')
        }
      }
    } catch (error) {
      console.warn('Failed to extract features from OpenAPI spec:', error)
    }

    return features
  }

  /**
   * Extract HTTP status code from error object
   */
  private extractStatusCode(error: any): number | undefined {
    if (error?.response?.status) {
      return error.response.status
    }
    if (error?.status) {
      return error.status
    }
    if (error?.code) {
      // Map common error codes to HTTP status codes
      const codeMap: Record<string, number> = {
        'ENOTFOUND': 404,
        'ECONNREFUSED': 503,
        'ETIMEDOUT': 408,
        'ECONNRESET': 503,
      }
      return codeMap[error.code]
    }
    return undefined
  }
}

// Export a singleton instance
export const wikibaseConfigService = new WikibaseConfigService()
