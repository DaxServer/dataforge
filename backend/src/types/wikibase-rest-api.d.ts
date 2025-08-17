/**
 * Type declarations for @wmde/wikibase-rest-api package
 */

declare module '@wmde/wikibase-rest-api' {
  export class ApiClient {
    constructor(basePath?: string)
    basePath: string
    defaultHeaders?: Record<string, string>
  }

  export class PropertiesApi {
    constructor(apiClient?: ApiClient)
    getProperty(
      propertyId: string,
      ifModifiedSince?: string,
      ifMatch?: string,
      ifUnmodifiedSince?: string,
      authorization?: string,
    ): Promise<any>
    getPropertyWithHttpInfo(
      propertyId: string,
      ifModifiedSince?: string,
      ifMatch?: string,
      ifUnmodifiedSince?: string,
      authorization?: string,
    ): Promise<any>
    addProperty(
      addPropertyRequest: any,
      ifMatch?: string,
      ifUnmodifiedSince?: string,
      authorization?: string,
    ): Promise<any>
    addPropertyWithHttpInfo(
      addPropertyRequest: any,
      ifMatch?: string,
      ifUnmodifiedSince?: string,
      authorization?: string,
    ): Promise<any>
  }

  export class PropertySearchApi {
    constructor(apiClient?: ApiClient)
    simplePropertySearch(
      q: string,
      language?: string,
      limit?: number,
      offset?: number,
    ): Promise<any>
    simplePropertySearchWithHttpInfo(
      q: string,
      language?: string,
      limit?: number,
      offset?: number,
    ): Promise<any>
  }

  export class ItemsApi {
    constructor(apiClient?: ApiClient)
    getItem(
      itemId: string,
      ifModifiedSince?: string,
      ifMatch?: string,
      ifUnmodifiedSince?: string,
      authorization?: string,
    ): Promise<any>
    getItemWithHttpInfo(
      itemId: string,
      ifModifiedSince?: string,
      ifMatch?: string,
      ifUnmodifiedSince?: string,
      authorization?: string,
    ): Promise<any>
    patchItem(
      itemId: string,
      patchItemRequest: any,
      ifMatch?: string,
      ifUnmodifiedSince?: string,
      authorization?: string,
    ): Promise<any>
    patchItemWithHttpInfo(
      itemId: string,
      patchItemRequest: any,
      ifMatch?: string,
      ifUnmodifiedSince?: string,
      authorization?: string,
    ): Promise<any>
  }

  export class ItemSearchApi {
    constructor(apiClient?: ApiClient)
    simpleItemSearch(q: string, language?: string, limit?: number, offset?: number): Promise<any>
    simpleItemSearchWithHttpInfo(
      q: string,
      language?: string,
      limit?: number,
      offset?: number,
    ): Promise<any>
  }
}
