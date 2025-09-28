import type { InstanceId, PropertySearchResult } from '@backend/api/wikibase/schemas'
import { WikibaseClient } from '@backend/services/wikibase-clients'
import type {
  WikibaseGetEntitiesResponse,
  WikibaseSearchEntityResponse,
  WikibaseSearchEntityResult,
} from '@backend/types/mediawiki-api'
import type {
  ItemDetails,
  ItemSearchResult,
  PropertyDetails,
  SearchOptions,
  SearchResponse,
} from '@backend/types/wikibase-api'
import type { ItemId, PropertyId } from '@backend/types/wikibase-schema'
import type { DuckDBConnection } from '@duckdb/node-api'

interface AllPagesResponse {
  batchcomplete?: string
  continue?: {
    apcontinue: string
    continue: string
  }
  query: {
    allpages: Array<{
      pageid: number
      ns: number
      title: string
    }>
  }
}

export class WikibaseService extends WikibaseClient {
  async fetchAllProperties(
    instanceId: InstanceId,
    db: DuckDBConnection,
  ): Promise<{ total: number; inserted: number }> {
    let total = 0
    let inserted = 0
    let continueToken: string | undefined
    const client = this.getClient(instanceId)

    const params: Record<string, string | number> = {
      action: 'query',
      list: 'allpages',
      apnamespace: 120, // Property namespace
      aplimit: 500, // Maximum allowed
      format: 'json',
    }

    do {
      if (continueToken) {
        params.apcontinue = continueToken
      }

      const response = await client.get<AllPagesResponse>(params)

      if (response.error) {
        throw new Error(`API Error: ${response.error.code}`)
      }

      if (response.query?.allpages) {
        const properties = response.query.allpages.map((page) => ({
          id: page.title.replace('Property:', ''),
          title: page.title,
          pageid: page.pageid,
          namespace: page.ns,
        }))

        total += properties.length

        // Insert properties into database
        for (const property of properties) {
          try {
            await db.run(
              `INSERT OR REPLACE INTO wikibase_properties
               (id, title, pageid, namespace)
               VALUES (?, ?, ?, ?)`,
              [property.id, property.title, property.pageid, property.namespace],
            )
            inserted++
          } catch (error) {
            console.error(`Failed to insert property ${property.id}:`, error)
          }
        }
      }

      continueToken = response.continue?.apcontinue
    } while (continueToken)

    return { total, inserted }
  }

  /**
   * Search for properties in the specified Wikibase instance
   */
  async searchProperties(
    instanceId: InstanceId,
    query: string,
    options: SearchOptions,
  ): Promise<SearchResponse<PropertySearchResult>> {
    const client = this.getClient(instanceId)
    const languageFallback = options.languageFallback ?? true

    const searchParams: Record<string, string | number | boolean> = {
      action: 'wbsearchentities',
      search: query,
      type: 'property',
      language: options.language,
      uselang: options.language,
      limit: options.limit,
      continue: options.offset,
      format: 'json',
      strictlanguage: !languageFallback,
    }

    const response = (await client.get(searchParams)) as WikibaseSearchEntityResponse<PropertyId>

    if (response.error) {
      throw new Error(`Search failed: ${response.error.code}`)
    }

    return {
      results: response.search.map((item) => ({
        id: item.id,
        title: item.title,
        pageid: item.pageid,
        datatype: item.datatype,
        label: item.label,
        description: item.description,
        match: item.match,
        aliases: item.aliases ?? [],
      })),
      totalCount: response.search.length,
      hasMore: response['search-continue'] !== undefined,
      query,
    }
  }

  /**
   * Get property details by ID
   */
  async getProperty(
    instanceId: InstanceId,
    propertyId: PropertyId,
  ): Promise<PropertyDetails | null> {
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
    instanceId: InstanceId,
    query: string,
    options: SearchOptions,
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
      totalCount: results.length,
      hasMore: response['search-continue'] !== undefined,
      query,
    }
  }

  /**
   * Get item details by ID
   */
  async getItem(instanceId: InstanceId, itemId: ItemId): Promise<ItemDetails | null> {
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
