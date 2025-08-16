import {
  ApiClient,
  PropertiesApi,
  PropertySearchApi,
  ItemsApi,
  ItemSearchApi,
} from '@wmde/wikibase-rest-api'
import type {
  WikibaseInstanceConfig,
  PropertyDetails,
  PropertySearchResult,
  PropertyConstraint,
  ItemDetails,
  ItemSearchResult,
  SearchOptions,
  PropertyDataTypeMap,
  SearchResponse,
} from '@backend/types/wikibase-api'

/**
 * Wrapper for Wikibase REST API clients
 */
interface WikibaseClientWrapper {
  apiClient: ApiClient
  propertiesApi: PropertiesApi
  propertySearchApi: PropertySearchApi
  itemsApi: ItemsApi
  itemSearchApi: ItemSearchApi
}

/**
 * Wikibase API Service for managing client instances and API operations
 */
export class WikibaseApiService {
  private clients: Map<string, WikibaseClientWrapper> = new Map()
  private instances: Map<string, WikibaseInstanceConfig> = new Map()

  /**
   * Create a new Wikibase REST API client for the given instance configuration
   */
  createClient(instanceConfig: WikibaseInstanceConfig): WikibaseClientWrapper {
    const apiClient = new ApiClient(instanceConfig.baseUrl)

    // Configure authentication if provided
    if (instanceConfig.authToken) {
      apiClient.defaultHeaders = {
        ...apiClient.defaultHeaders,
        Authorization: `Bearer ${instanceConfig.authToken}`,
      }
    }

    // Set user agent
    apiClient.defaultHeaders = {
      ...apiClient.defaultHeaders,
      'User-Agent': instanceConfig.userAgent,
    }

    const client: WikibaseClientWrapper = {
      apiClient,
      propertiesApi: new PropertiesApi(apiClient),
      propertySearchApi: new PropertySearchApi(apiClient),
      itemsApi: new ItemsApi(apiClient),
      itemSearchApi: new ItemSearchApi(apiClient),
    }

    this.clients.set(instanceConfig.id, client)
    this.instances.set(instanceConfig.id, instanceConfig)

    return client
  }

  /**
   * Get an existing client for the given instance ID
   */
  getClient(instanceId: string): WikibaseClientWrapper {
    const client = this.clients.get(instanceId)
    if (!client) {
      throw new Error(`No client found for instance: ${instanceId}`)
    }
    return client
  }

  /**
   * Get instance configuration by ID
   */
  getInstance(instanceId: string): WikibaseInstanceConfig {
    const instance = this.instances.get(instanceId)
    if (!instance) {
      throw new Error(`No instance configuration found for: ${instanceId}`)
    }
    return instance
  }

  /**
   * Check if a client exists for the given instance ID
   */
  hasClient(instanceId: string): boolean {
    return this.clients.has(instanceId)
  }

  /**
   * Remove a client and its configuration
   */
  removeClient(instanceId: string): boolean {
    const clientRemoved = this.clients.delete(instanceId)
    const instanceRemoved = this.instances.delete(instanceId)
    return clientRemoved && instanceRemoved
  }

  /**
   * Get all registered instance IDs
   */
  getInstanceIds(): string[] {
    return Array.from(this.instances.keys())
  }

  /**
   * Get all registered instances
   */
  getAllInstances(): WikibaseInstanceConfig[] {
    return Array.from(this.instances.values())
  }

  /**
   * Search for properties in the specified Wikibase instance
   */
  async searchProperties(
    instanceId: string,
    query: string,
    options: SearchOptions = {},
  ): Promise<SearchResponse<PropertySearchResult>> {
    const client = this.getClient(instanceId)

    try {
      const response = await client.propertySearchApi.simplePropertySearch(
        query,
        options.limit || 10,
        options.offset || 0,
      )

      const results: PropertySearchResult[] =
        response.results?.map((item: any) => ({
          id: item.id,
          label: item.display_label?.value || item.id,
          description: item.description?.value,
          dataType: item.data_type || 'unknown',
          match: {
            type: item.match?.type || 'label',
            text: item.match?.text || item.display_label?.value || item.id,
          },
        })) || []

      return {
        results,
        totalCount: results.length, // Simple search doesn't provide total count
        hasMore: results.length === (options.limit || 10),
        query,
      }
    } catch (error) {
      throw new Error(
        `Failed to search properties: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Get detailed information about a specific property
   */
  async getProperty(instanceId: string, propertyId: string): Promise<PropertyDetails> {
    const client = this.getClient(instanceId)

    try {
      const response = await client.propertiesApi.getProperty(propertyId)

      return {
        id: response.id,
        labels: response.labels || {},
        descriptions: response.descriptions || {},
        aliases: response.aliases || {},
        dataType: response.data_type || 'unknown',
        statements: response.statements || [],
        constraints: [], // Will be populated by getPropertyConstraints
      }
    } catch (error) {
      throw new Error(
        `Failed to get property ${propertyId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Search for items in the specified Wikibase instance
   */
  async searchItems(
    instanceId: string,
    query: string,
    options: SearchOptions = {},
  ): Promise<SearchResponse<ItemSearchResult>> {
    const client = this.getClient(instanceId)

    try {
      const response = await client.itemSearchApi.simpleItemSearch(
        query,
        options.limit || 10,
        options.offset || 0,
      )

      const results: ItemSearchResult[] =
        response.results?.map((item: any) => ({
          id: item.id,
          label: item.display_label?.value || item.id,
          description: item.description?.value,
          match: {
            type: item.match?.type || 'label',
            text: item.match?.text || item.display_label?.value || item.id,
          },
        })) || []

      return {
        results,
        totalCount: results.length, // Simple search doesn't provide total count
        hasMore: results.length === (options.limit || 10),
        query,
      }
    } catch (error) {
      throw new Error(
        `Failed to search items: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Get detailed information about a specific item
   */
  async getItem(instanceId: string, itemId: string): Promise<ItemDetails> {
    const client = this.getClient(instanceId)

    try {
      const response = await client.itemsApi.getItem(itemId)

      return {
        id: response.id,
        labels: response.labels || {},
        descriptions: response.descriptions || {},
        aliases: response.aliases || {},
        statements: response.statements || [],
        sitelinks: response.sitelinks || {},
      }
    } catch (error) {
      throw new Error(
        `Failed to get item ${itemId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Get property constraints from property statements
   */
  async getPropertyConstraints(
    instanceId: string,
    propertyId: string,
  ): Promise<PropertyConstraint[]> {
    // Ensure client exists for the instance
    this.getClient(instanceId)

    try {
      const property = await this.getProperty(instanceId, propertyId)
      const constraints: PropertyConstraint[] = []

      // Parse constraints from property statements
      // In Wikibase, constraints are stored as statements with specific constraint properties
      // For Wikidata, P2302 is the "property constraint" property
      if (property.statements && Array.isArray(property.statements)) {
        for (const statement of property.statements) {
          if (this.isConstraintStatement(statement)) {
            const constraint = this.parseConstraintStatement(statement)
            if (constraint) {
              constraints.push(constraint)
            }
          }
        }
      }

      return constraints
    } catch (error) {
      throw new Error(
        `Failed to get constraints for property ${propertyId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Get data types for properties (simplified implementation)
   */
  async getPropertyDataTypes(instanceId: string): Promise<PropertyDataTypeMap> {
    // Ensure client exists for the instance
    this.getClient(instanceId)

    try {
      // This would typically be cached or fetched from a dedicated endpoint
      // For now, return an empty map - this will be enhanced in future iterations
      // In a real implementation, this might fetch from a property data types endpoint
      // or build the map from multiple property queries
      return {}
    } catch (error) {
      throw new Error(
        `Failed to get property data types: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Check if a statement represents a constraint
   */
  private isConstraintStatement(statement: any): boolean {
    if (!statement) return false

    // In Wikidata, P2302 is the "property constraint" property
    // Check both direct property and mainsnak property for different statement formats
    const propertyId = statement.property || statement.mainsnak?.property

    // Common constraint properties across different Wikibase instances
    const constraintProperties = ['P2302', 'constraint'] // P2302 for Wikidata, 'constraint' as fallback

    return constraintProperties.includes(propertyId)
  }

  /**
   * Parse a constraint statement into a PropertyConstraint object
   */
  private parseConstraintStatement(statement: any): PropertyConstraint | null {
    try {
      if (!statement) return null

      // Extract constraint type from the statement value
      let constraintType = 'unknown'
      let constraintId = ''

      // Handle different statement formats
      if (statement.mainsnak?.datavalue?.value?.id) {
        constraintId = statement.mainsnak.datavalue.value.id
        constraintType = this.getConstraintTypeName(constraintId)
      } else if (statement.value?.content) {
        constraintType = statement.value.content
      } else if (typeof statement.value === 'string') {
        constraintType = statement.value
      }

      const parameters = this.extractConstraintParameters(statement)

      return {
        type: constraintType,
        parameters,
        description: this.getConstraintDescription(constraintType, constraintId),
        violationMessage: this.getConstraintViolationMessage(constraintType),
      }
    } catch (error) {
      console.warn('Failed to parse constraint statement:', error)
      return null
    }
  }

  /**
   * Extract parameters from constraint qualifiers
   */
  private extractConstraintParameters(statement: any): Record<string, any> {
    const parameters: Record<string, any> = {}

    try {
      // Extract from qualifiers (Wikidata format)
      if (statement.qualifiers) {
        for (const [property, qualifiers] of Object.entries(statement.qualifiers)) {
          if (Array.isArray(qualifiers)) {
            parameters[property] = qualifiers.map((q: any) => q.datavalue?.value || q.value || q)
          } else {
            parameters[property] = qualifiers
          }
        }
      }

      // Extract from references if present
      if (statement.references && Array.isArray(statement.references)) {
        parameters.references = statement.references.map((ref: any) => ({
          parts: ref.parts || [],
        }))
      }

      // Extract rank information
      if (statement.rank) {
        parameters.rank = statement.rank
      }
    } catch (error) {
      console.warn('Failed to extract constraint parameters:', error)
    }

    return parameters
  }

  /**
   * Get human-readable constraint type name from constraint ID
   */
  private getConstraintTypeName(constraintId: string): string {
    // Map common Wikidata constraint IDs to readable names
    const constraintTypeMap: Record<string, string> = {
      Q21502408: 'format constraint',
      Q21510865: 'allowed values constraint',
      Q21510862: 'value type constraint',
      Q21510856: 'value requires statement constraint',
      Q21510857: 'conflicts with constraint',
      Q21510859: 'item requires statement constraint',
      Q21510863: 'allowed qualifiers constraint',
      Q21510864: 'required qualifier constraint',
      Q21510851: 'range constraint',
      Q21510855: 'subject type constraint',
      Q25796498: 'single value constraint',
      Q19474404: 'single best value constraint',
      Q21510860: 'inverse constraint',
      Q21510854: 'symmetric constraint',
      Q52004125: 'property scope constraint',
    }

    return constraintTypeMap[constraintId] || constraintId || 'unknown constraint'
  }

  /**
   * Get constraint description
   */
  private getConstraintDescription(constraintType: string, constraintId: string): string {
    const descriptions: Record<string, string> = {
      'format constraint': 'Values must match a specific format pattern',
      'allowed values constraint': 'Only specific values are allowed',
      'value type constraint': 'Values must be of a specific type',
      'range constraint': 'Numeric values must be within a specific range',
      'single value constraint': 'Property should have only one value',
      'required qualifier constraint': 'Statements must have specific qualifiers',
      'allowed qualifiers constraint': 'Only specific qualifiers are allowed',
    }

    return descriptions[constraintType] || `Constraint of type: ${constraintType} (${constraintId})`
  }

  /**
   * Get constraint violation message
   */
  private getConstraintViolationMessage(constraintType: string): string {
    const violationMessages: Record<string, string> = {
      'format constraint': 'Value does not match the required format',
      'allowed values constraint': 'Value is not in the list of allowed values',
      'value type constraint': 'Value is not of the required type',
      'range constraint': 'Value is outside the allowed range',
      'single value constraint': 'Property has multiple values but should have only one',
      'required qualifier constraint': 'Statement is missing required qualifiers',
      'allowed qualifiers constraint': 'Statement has disallowed qualifiers',
    }

    return violationMessages[constraintType] || `Violation of ${constraintType} constraint`
  }
}

// Export a singleton instance
export const wikibaseApiService = new WikibaseApiService()
