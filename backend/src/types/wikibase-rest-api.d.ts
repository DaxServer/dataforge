/**
 * Type declarations for @wmde/wikibase-rest-api package
 * This package doesn't provide its own TypeScript declarations
 */

declare module '@wmde/wikibase-rest-api' {
  export class ApiClient {
    constructor(basePath?: string)
    basePath: string
    defaultHeaders: Record<string, string>
  }

  export class PropertiesApi {
    constructor(apiClient: ApiClient)
    getProperty(propertyId: string): Promise<any>
  }

  export class PropertySearchApi {
    constructor(apiClient: ApiClient)
    simplePropertySearch(query: string, limit?: number, offset?: number): Promise<any>
  }

  export class ItemsApi {
    constructor(apiClient: ApiClient)
    getItem(itemId: string): Promise<any>
  }

  export class ItemSearchApi {
    constructor(apiClient: ApiClient)
    simpleItemSearch(query: string, limit?: number, offset?: number): Promise<any>
  }
}
