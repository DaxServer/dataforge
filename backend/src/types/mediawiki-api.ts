/**
 * MediaWiki Action API type definitions
 * Based on MediaWiki Action API documentation
 * @see https://www.mediawiki.org/wiki/API:Main_page
 */

// Base API Configuration
export interface MediaWikiConfig {
  endpoint: string
  userAgent: string
  timeout: number
  username?: string
  password?: string
  token?: string
}

// Extended MediaWiki configuration with metadata
export interface MediaWikiInstanceConfig extends MediaWikiConfig {
  id: string
  name: string
}

// Common API Parameters
export interface BaseApiParams {
  action: string
  format?: 'json'
  formatversion?: 2
  maxlag?: number
  smaxage?: number
  maxage?: number
  assert?: 'user' | 'bot' | 'anon'
  assertuser?: string
  requestid?: string
  servedby?: boolean
  curtimestamp?: boolean
  responselanginfo?: boolean
  origin?: string
  uselang?: string
  errorformat?: 'plaintext' | 'wikitext' | 'html' | 'raw' | 'none'
  errorlang?: string
  errorsuselocal?: boolean
}

// Query API Types
export interface QueryParams extends BaseApiParams {
  action: 'query'
  prop?: string
  list?: string
  meta?: string
  generator?: string
  redirects?: boolean
  converttitles?: boolean
  titles?: string
  pageids?: string
  revids?: string
  indexpageids?: boolean
  export?: boolean
  exportnowrap?: boolean
  iwurl?: boolean
  continue?: string
  rawcontinue?: boolean
}

// Search API Types
export interface SearchParams extends BaseApiParams {
  action: 'query'
  list: 'search'
  srsearch: string
  srnamespace?: string
  srlimit?: number
  sroffset?: number
  srqiprofile?: string
  srwhat?: 'title' | 'text' | 'nearmatch'
  srinfo?: string
  srprop?: string
  srinterwiki?: boolean
  srenablerewrites?: boolean
  srsort?: 'relevance' | 'last_edit_desc' | 'create_timestamp_desc'
}

export interface SearchResult {
  ns: number
  title: string
  pageid: number
  size: number
  wordcount: number
  snippet: string
  timestamp: string
}

export interface SearchResponse {
  batchcomplete?: string
  continue?: {
    sroffset: number
    continue: string
  }
  query: {
    searchinfo: {
      totalhits: number
      suggestion?: string
      suggestionsnippet?: string
    }
    search: SearchResult[]
  }
}

// Page Content API Types
export interface PageContentParams extends BaseApiParams {
  action: 'query'
  prop: 'revisions'
  titles?: string
  pageids?: string
  rvprop?: string
  rvslots?: string
  rvlimit?: number
  rvstartid?: number
  rvendid?: number
  rvstart?: string
  rvend?: string
  rvdir?: 'newer' | 'older'
  rvuser?: string
  rvexcludeuser?: string
  rvtag?: string
  rvcontinue?: string
}

export interface PageRevision {
  revid: number
  parentid: number
  minor?: boolean
  user: string
  userid: number
  timestamp: string
  size: number
  comment: string
  contentformat?: string
  contentmodel?: string
  contentsha1?: string
  slots?: {
    main: {
      contentmodel: string
      contentformat: string
      content: string
    }
  }
}

export interface Page {
  pageid: number
  ns: number
  title: string
  revisions?: PageRevision[]
  missing?: boolean
  invalid?: boolean
  contentmodel?: string
  pagelanguage?: string
  pagelanguagehtmlcode?: string
  pagelanguagedir?: string
  touched?: string
  lastrevid?: number
  length?: number
}

export interface PageContentResponse {
  batchcomplete?: string
  query: {
    pages: Record<string, Page>
  }
}

// Authentication API Types
export interface LoginParams extends BaseApiParams {
  action: 'clientlogin'
  username: string
  password: string
  logintoken: string
  loginreturnurl?: string
  logincontinue?: boolean
  rememberMe?: boolean
}

export interface LoginResponse {
  clientlogin: {
    status: 'PASS' | 'FAIL' | 'UI' | 'REDIRECT' | 'RESTART'
    username?: string
    userid?: number
    message?: string
    messagecode?: string
    requests?: Array<{
      id: string
      metadata: Record<string, any>
      required: string
      provider: string
      account: string
      fields: Record<string, any>
    }>
  }
}

export interface TokenParams extends BaseApiParams {
  action: 'query'
  meta: 'tokens'
  type?: string
}

export interface TokenResponse {
  batchcomplete?: string
  query: {
    tokens: {
      csrftoken?: string
      logintoken?: string
      watchtoken?: string
      rollbacktoken?: string
      patroltoken?: string
      edittoken?: string
      deletetoken?: string
      protecttoken?: string
      movetoken?: string
      blocktoken?: string
      unblocktoken?: string
      importtoken?: string
      optionstoken?: string
      userrighttoken?: string
    }
  }
}

// Edit API Types
export interface EditParams extends BaseApiParams {
  action: 'edit'
  title?: string
  pageid?: number
  section?: string | number
  sectiontitle?: string
  text?: string
  summary?: string
  tags?: string
  minor?: boolean
  notminor?: boolean
  bot?: boolean
  basetimestamp?: string
  starttimestamp?: string
  recreate?: boolean
  createonly?: boolean
  nocreate?: boolean
  watch?: boolean
  unwatch?: boolean
  watchlist?: 'watch' | 'unwatch' | 'preferences' | 'nochange'
  md5?: string
  prependtext?: string
  appendtext?: string
  undo?: number
  undoafter?: number
  redirect?: boolean
  contentformat?: string
  contentmodel?: string
  token: string
}

export interface EditResponse {
  edit: {
    result: 'Success' | 'Failure'
    pageid?: number
    title?: string
    contentmodel?: string
    oldrevid?: number
    newrevid?: number
    newtimestamp?: string
    watched?: boolean
    nochange?: boolean
    captcha?: {
      type: string
      mime: string
      id: string
      url: string
    }
  }
}

// Site Info API Types
export interface SiteInfoParams extends BaseApiParams {
  action: 'query'
  meta: 'siteinfo'
  siprop?: string
  sifilteriw?: string
  sishowalldb?: boolean
  sinumberingroup?: string
}

// Error Types
export interface ApiError {
  code: string
  info: string
  docref?: string
  module?: string
}

export interface ApiErrorResponse {
  error: ApiError
  servedby?: string
  requestid?: string
}

// Generic API Response
export type ApiResponse<T = Record<string, any>> = T & {
  batchcomplete?: string
  continue?: Record<string, any>
  warnings?: Record<string, any>
  error?: ApiError
  servedby?: string
  requestid?: string
}

// Wikibase API Types
export interface WikibaseSearchEntityParams extends BaseApiParams {
  action: 'wbsearchentities'
  search: string
  type: 'item' | 'property' | 'lexeme'
  language?: string
  limit?: number
  continue?: number
  strictlanguage?: boolean
}

export interface WikibaseSearchEntityResult {
  id: string
  label?: string
  description?: string
  datatype?: string
  match?: {
    type?: string
    language?: string
    text?: string
  }
}

export interface WikibaseSearchEntityResponse {
  search?: WikibaseSearchEntityResult[]
  'search-info'?: {
    search?: number
  }
  'search-continue'?: number
  error?: ApiError
}

export interface WikibaseGetEntitiesParams extends BaseApiParams {
  action: 'wbgetentities'
  ids: string
  props?: string
  languagefallback?: boolean
}

export interface WikibaseEntityLabel {
  language: string
  value: string
}

export interface WikibaseEntityDescription {
  language: string
  value: string
}

export interface WikibaseEntityAlias {
  language: string
  value: string
}

export interface WikibaseEntitySnak {
  snaktype: 'value' | 'somevalue' | 'novalue'
  property: string
  datatype?: string
  datavalue?: {
    value: any
    type: string
  }
  hash?: string
}

export interface WikibaseEntityClaim {
  id?: string
  mainsnak?: WikibaseEntitySnak
  rank?: 'normal' | 'preferred' | 'deprecated'
  qualifiers?: Record<string, WikibaseEntitySnak[]>
  'qualifiers-order'?: string[]
  references?: Array<{
    hash: string
    snaks: Record<string, WikibaseEntitySnak[]>
    'snaks-order': string[]
  }>
}

export interface WikibaseEntitySitelink {
  site: string
  title: string
  badges?: string[]
}

export interface WikibaseEntity {
  id: string
  type: 'item' | 'property' | 'lexeme'
  datatype?: string
  labels?: Record<string, WikibaseEntityLabel>
  descriptions?: Record<string, WikibaseEntityDescription>
  aliases?: Record<string, WikibaseEntityAlias[]>
  claims?: Record<string, WikibaseEntityClaim[]>
  sitelinks?: Record<string, WikibaseEntitySitelink>
  missing?: boolean
}

export interface WikibaseGetEntitiesResponse {
  entities?: Record<string, WikibaseEntity>
  error?: ApiError
}

// Service Options
export interface MediaWikiServiceOptions {
  retryAttempts?: number
  retryDelay?: number
  cacheEnabled?: boolean
  cacheTtl?: number
  rateLimitDelay?: number
  maxConcurrentRequests?: number
}
