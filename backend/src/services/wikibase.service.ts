import { MediaWikiApiService } from '@backend/services/mediawiki-api.service'
import type {
  MediaWikiConfig,
  WikibaseGetEntitiesResponse,
  WikibaseSearchEntityResponse,
  WikibaseSearchEntityResult,
} from '@backend/types/mediawiki-api'
import type {
  ItemDetails,
  ItemSearchResult,
  PropertyDetails,
  PropertySearchResult,
  SearchOptions,
  SearchResponse,
} from '@backend/types/wikibase-api'
import type { ItemId, PropertyId } from '@backend/types/wikibase-schema'

/**
 * Wikibase API Service using MediaWiki API for comprehensive Wikibase coverage
 */
export class WikibaseService {
  private clients: Record<string, MediaWikiApiService> = {
    wikidata: new MediaWikiApiService({
      endpoint: 'https://www.wikidata.org/w/api.php',
      userAgent: 'DataForge/1.0 (https://github.com/DaxServer/dataforge)',
      timeout: 30000,
    }),
  }

  /**
   * Create a new client for a Wikibase instance
   */
  createClient(id: string, config: MediaWikiConfig): MediaWikiApiService {
    const client = new MediaWikiApiService({
      endpoint: config.endpoint,
      userAgent: config.userAgent,
      timeout: config.timeout,
      token: config.token,
    })

    this.clients[id] = client

    return client
  }

  /**
   * Get an existing client for the given instance ID
   */
  getClient(instanceId: string): MediaWikiApiService {
    const client = this.clients[instanceId]
    if (!client) {
      throw new Error(`No client found for instance: ${instanceId}`)
    }
    return client
  }

  hasClient(instanceId: string): boolean {
    return this.clients[instanceId] !== undefined
  }

  removeClient(instanceId: string): boolean {
    const clientRemoved = this.clients[instanceId] !== undefined
    delete this.clients[instanceId]
    return clientRemoved
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
    const limit = options.limit ?? 10
    const language = options.language ?? 'en'
    const languageFallback = options.languageFallback ?? true

    const searchParams: Record<string, string | number | boolean> = {
      action: 'wbsearchentities',
      search: query,
      type: 'property',
      language,
      limit,
      continue: options.offset ?? 0,
      format: 'json',
      formatVersion: 2,
      strictlanguage: !languageFallback,
    }

    const response = (await client.get(searchParams)) as WikibaseSearchEntityResponse<PropertyId>

    if (response.error) {
      throw new Error(`Search failed: ${response.error.code}`)
    }

    const mapSearchResult = (
      item: WikibaseSearchEntityResult<PropertyId>,
    ): PropertySearchResult => ({
      id: item.id,
      label: item.label || item.id,
      description: item.description || '',
      datatype: item.datatype || 'string',
      match: {
        type:
          item.match?.type === 'alias' || item.match?.type === 'description'
            ? item.match.type
            : 'label',
        text: item.match?.text || item.label || item.id,
      },
    })

    let results: PropertySearchResult[] = response.search?.map(mapSearchResult) ?? []

    if (options.datatype) {
      results = results.filter((result) => result.datatype === options.datatype)
    }

    return {
      results,
      totalCount: response['search-info']?.search || results.length,
      hasMore: response['search-continue'] !== undefined,
      query,
    }
  }

  /**
   * Get property details by ID
   */
  async getProperty(instanceId: string, propertyId: PropertyId): Promise<PropertyDetails | null> {
    const client = this.getClient(instanceId)

    const params = {
      action: 'wbgetentities',
      ids: propertyId,
      languagefallback: true,
      format: 'json',
    }

    const response = (await client.get(params)) as WikibaseGetEntitiesResponse

    const entity = response.entities[propertyId]!
    if ('missing' in entity) {
      return null
    }

    const labels = entity.labels ?? {}
    const descriptions = entity.descriptions ?? {}
    const aliases = entity.aliases ?? {}

    const propertyDetails: PropertyDetails = {
      id: propertyId,
      type: 'property',
      datatype: entity.datatype ?? 'string',
      labels: Object.fromEntries(
        Object.entries(labels).map(([lang, data]) => [lang, (data as { value: string }).value]),
      ),
      descriptions: Object.fromEntries(
        Object.entries(descriptions).map(([lang, data]) => [
          lang,
          (data as { value: string }).value,
        ]),
      ),
      aliases: Object.fromEntries(
        Object.entries(aliases).map(([lang, aliasArray]) => [
          lang,
          (aliasArray as { value: string }[]).map((alias) => alias.value),
        ]),
      ),
      claims: (entity.claims as Record<string, any[]>) || {},
    }

    return propertyDetails
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
    const limit = options.limit ?? 10
    const language = options.language ?? 'en'
    const languageFallback = options.languageFallback ?? true

    const searchParams: Record<string, string | number | boolean> = {
      action: 'wbsearchentities',
      search: query,
      type: 'item',
      language,
      limit,
      continue: options.offset ?? 0,
      format: 'json',
      formatVersion: 2,
      strictlanguage: !languageFallback,
    }

    const response = (await client.get(searchParams)) as WikibaseSearchEntityResponse<ItemId>

    if (response.error) {
      throw new Error(`Search failed: ${response.error.code}`)
    }

    const mapSearchResult = (item: WikibaseSearchEntityResult<ItemId>): ItemSearchResult => ({
      id: item.id,
      label: item.label || item.id,
      description: item.description || '',
      match: {
        type:
          item.match?.type === 'alias' || item.match?.type === 'description'
            ? item.match.type
            : 'label',
        text: item.match?.text || item.label || item.id,
      },
    })

    const results: ItemSearchResult[] = response.search?.map(mapSearchResult) ?? []

    return {
      results,
      totalCount: response['search-info']?.search || results.length,
      hasMore: response['search-continue'] !== undefined,
      query,
    }
  }

  /**
   * Get item details by ID
   */
  async getItem(instanceId: string, itemId: ItemId): Promise<ItemDetails | null> {
    const client = this.getClient(instanceId)

    const params = {
      action: 'wbgetentities',
      ids: itemId,
      languagefallback: true,
      format: 'json',
      errorformat: 'raw',
    }

    const response = (await client.get(params)) as WikibaseGetEntitiesResponse

    for (const error of response.errors ?? []) {
      if (error.key === 'wikibase-api-no-such-entity') {
        return null
      }
    }

    const entity = response.entities[itemId]!
    const itemDetails: ItemDetails = {
      id: itemId,
      type: 'item',
      labels: entity.labels
        ? Object.fromEntries(
            Object.entries(entity.labels).map(([lang, label]) => [lang, label.value]),
          )
        : {},
      descriptions: entity.descriptions
        ? Object.fromEntries(
            Object.entries(entity.descriptions).map(([lang, desc]) => [lang, desc.value]),
          )
        : {},
      aliases: entity.aliases
        ? Object.fromEntries(
            Object.entries(entity.aliases).map(([lang, aliases]) => [
              lang,
              aliases.map((alias) => alias.value),
            ]),
          )
        : {},
      claims: entity.claims ? this.convertEntityClaimsToClaims(entity.claims) : {},
    }

    return itemDetails
  }

  /**
   * Convert WikibaseEntityClaim[] to Claim[]
   */
  private convertEntityClaimsToClaims(entityClaims: Record<string, any[]>): Record<string, any[]> {
    const claims: Record<string, any[]> = {}

    for (const [propertyId, claimArray] of Object.entries(entityClaims)) {
      claims[propertyId] = claimArray.map((claim) => ({
        ...claim,
        type: 'statement',
        property: propertyId,
        datatype: claim.mainsnak?.datatype || 'unknown',
        hash: claim.id || '',
        qualifiers: claim.qualifiers || {},
        references: claim.references || [],
      }))
    }

    return claims
  }
}

// Export a singleton instance
export const wikibaseService = new WikibaseService()
