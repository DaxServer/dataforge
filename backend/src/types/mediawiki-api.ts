/**
 * MediaWiki Action API type definitions
 * Based on MediaWiki Action API documentation
 * @see https://www.mediawiki.org/wiki/API:Main_page
 */

import type { WikibaseDataType } from '@backend/types/wikibase-schema'
import { t } from 'elysia'

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
  key?: string
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

export interface WikibaseSearchEntityResult<T> {
  id: T
  label?: string
  description?: string
  datatype?: WikibaseDataType
  match?: {
    type?: string
    language?: string
    text?: string
  }
}

export interface WikibaseSearchEntityResponse<T> {
  search?: WikibaseSearchEntityResult<T>[]
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
  datatype?: WikibaseDataType
  labels?: Record<string, WikibaseEntityLabel>
  descriptions?: Record<string, WikibaseEntityDescription>
  aliases?: Record<string, WikibaseEntityAlias[]>
  claims?: Record<string, WikibaseEntityClaim[]>
  sitelinks?: Record<string, WikibaseEntitySitelink>
  missing?: string
}

export interface WikibaseGetEntitiesResponse {
  entities: Record<string, WikibaseEntity>
  errors?: ApiError[]
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

// Elysia schemas for MediaWiki API responses (formatversion=2)
export const MediaWikiApiBaseResponseSchema = t.Object({
  batchcomplete: t.Optional(t.Boolean()),
  continue: t.Optional(t.Record(t.String(), t.String())),
  warnings: t.Optional(
    t.Record(
      t.String(),
      t.Object({
        warnings: t.String(),
        module: t.Optional(t.String()),
      }),
    ),
  ),
  error: t.Optional(
    t.Object({
      code: t.String(),
      info: t.String(),
      docref: t.Optional(t.String()),
    }),
  ),
})

export const MediaWikiSearchResultSchema = t.Object({
  ns: t.Number(),
  title: t.String(),
  pageid: t.Optional(t.Number()),
  size: t.Optional(t.Number()),
  wordcount: t.Optional(t.Number()),
  snippet: t.Optional(t.String()),
  timestamp: t.Optional(t.String()),
})

export const MediaWikiSearchResponseSchema = t.Intersect([
  MediaWikiApiBaseResponseSchema,
  t.Object({
    query: t.Object({
      searchinfo: t.Optional(
        t.Object({
          totalhits: t.Number(),
          suggestion: t.Optional(t.String()),
          suggestionsnippet: t.Optional(t.String()),
        }),
      ),
      search: t.Array(MediaWikiSearchResultSchema),
    }),
  }),
])

export const WikibaseSearchEntityResultSchema = t.Object({
  id: t.String(),
  title: t.Optional(t.String()),
  pageid: t.Optional(t.Number()),
  repository: t.Optional(t.String()),
  url: t.Optional(t.String()),
  concepturi: t.Optional(t.String()),
  label: t.Optional(t.String()),
  description: t.Optional(t.String()),
  match: t.Optional(
    t.Object({
      type: t.String(),
      language: t.Optional(t.String()),
      text: t.Optional(t.String()),
    }),
  ),
  aliases: t.Optional(t.Array(t.String())),
  display: t.Optional(
    t.Object({
      label: t.Optional(
        t.Object({
          value: t.String(),
          language: t.String(),
        }),
      ),
      description: t.Optional(
        t.Object({
          value: t.String(),
          language: t.String(),
        }),
      ),
    }),
  ),
})

export const WikibaseSearchEntitiesResponseSchema = t.Intersect([
  MediaWikiApiBaseResponseSchema,
  t.Object({
    search: t.Array(WikibaseSearchEntityResultSchema),
    'search-continue': t.Optional(t.Number()),
    success: t.Optional(t.Number()),
  }),
])

// Wikibase entity value schemas
export const WikibaseEntityValueSchema = t.Object({
  'entity-type': t.String(),
  'numeric-id': t.Optional(t.Number()),
  id: t.Optional(t.String()),
})

export const WikibaseDataValueSchema = t.Object({
  value: t.Union([
    t.String(),
    WikibaseEntityValueSchema,
    t.Object({
      // quantity
      amount: t.String(),
      unit: t.String(),
      upperBound: t.Optional(t.String()),
      lowerBound: t.Optional(t.String()),
    }),
    t.Object({
      // time
      time: t.String(),
      timezone: t.Number(),
      before: t.Number(),
      after: t.Number(),
      precision: t.Number(),
      calendarmodel: t.String(),
    }),
    t.Object({
      // globe-coordinate
      latitude: t.Number(),
      longitude: t.Number(),
      altitude: t.Optional(t.Number()),
      precision: t.Number(),
      globe: t.String(),
    }),
    t.Object({
      // monolingualtext
      text: t.String(),
      language: t.String(),
    }),
  ]),
  type: t.String(),
})

export const WikibaseSnakSchema = t.Object({
  snaktype: t.String(),
  property: t.String(),
  hash: t.Optional(t.String()),
  datavalue: t.Optional(WikibaseDataValueSchema),
  datatype: t.Optional(t.String()),
})

export const WikibaseStatementSchema = t.Object({
  id: t.String(),
  mainsnak: WikibaseSnakSchema,
  type: t.Literal('statement'),
  rank: t.String(),
  qualifiers: t.Optional(t.Record(t.String(), t.Array(WikibaseSnakSchema))),
  'qualifiers-order': t.Optional(t.Array(t.String())),
  references: t.Optional(
    t.Array(
      t.Object({
        hash: t.String(),
        snaks: t.Record(t.String(), t.Array(WikibaseSnakSchema)),
        'snaks-order': t.Array(t.String()),
      }),
    ),
  ),
})

export const WikibaseTermSchema = t.Object({
  language: t.String(),
  value: t.String(),
})

export const WikibaseEntitySchema = t.Object({
  type: t.String(),
  id: t.String(),
  labels: t.Optional(t.Record(t.String(), WikibaseTermSchema)),
  descriptions: t.Optional(t.Record(t.String(), WikibaseTermSchema)),
  aliases: t.Optional(t.Record(t.String(), t.Array(WikibaseTermSchema))),
  claims: t.Optional(t.Record(t.String(), t.Array(WikibaseStatementSchema))),
  sitelinks: t.Optional(
    t.Record(
      t.String(),
      t.Object({
        site: t.String(),
        title: t.String(),
        badges: t.Optional(t.Array(t.String())),
        url: t.Optional(t.String()),
      }),
    ),
  ),
  lastrevid: t.Optional(t.Number()),
  pageid: t.Optional(t.Number()),
  ns: t.Optional(t.Number()),
  title: t.Optional(t.String()),
  modified: t.Optional(t.String()),
  datatype: t.Optional(t.String()),
})

export const WikibaseGetEntitiesResponseSchema = t.Intersect([
  MediaWikiApiBaseResponseSchema,
  t.Object({
    entities: t.Record(
      t.String(),
      t.Union([WikibaseEntitySchema, t.Object({ missing: t.Literal('') })]),
    ),
    success: t.Optional(t.Number()),
  }),
])

// MediaWiki revision and page info schemas
export const MediaWikiRevisionSchema = t.Object({
  revid: t.Number(),
  parentid: t.Optional(t.Number()),
  user: t.Optional(t.String()),
  userid: t.Optional(t.Number()),
  timestamp: t.String(),
  size: t.Optional(t.Number()),
  comment: t.Optional(t.String()),
  parsedcomment: t.Optional(t.String()),
  contentformat: t.Optional(t.String()),
  contentmodel: t.Optional(t.String()),
  sha1: t.Optional(t.String()),
  content: t.Optional(t.String()),
  tags: t.Optional(t.Array(t.String())),
  minor: t.Optional(t.Boolean()),
  anon: t.Optional(t.Boolean()),
})

export const MediaWikiPageSchema = t.Object({
  pageid: t.Number(),
  ns: t.Number(),
  title: t.String(),
  contentmodel: t.Optional(t.String()),
  pagelanguage: t.Optional(t.String()),
  pagelanguagehtmlcode: t.Optional(t.String()),
  pagelanguagedir: t.Optional(t.String()),
  touched: t.Optional(t.String()),
  lastrevid: t.Optional(t.Number()),
  length: t.Optional(t.Number()),
  redirect: t.Optional(t.Boolean()),
  new: t.Optional(t.Boolean()),
  starttimestamp: t.Optional(t.String()),
  edittoken: t.Optional(t.String()),
  revisions: t.Optional(t.Array(MediaWikiRevisionSchema)),
  missing: t.Optional(t.Boolean()),
  invalid: t.Optional(t.Boolean()),
  special: t.Optional(t.Boolean()),
})

export const MediaWikiQueryPagesResponseSchema = t.Intersect([
  MediaWikiApiBaseResponseSchema,
  t.Object({
    query: t.Object({
      pages: t.Record(t.String(), MediaWikiPageSchema),
      normalized: t.Optional(
        t.Array(
          t.Object({
            fromencoded: t.Optional(t.Boolean()),
            from: t.String(),
            to: t.String(),
          }),
        ),
      ),
      redirects: t.Optional(
        t.Array(
          t.Object({
            from: t.String(),
            to: t.String(),
            tofragment: t.Optional(t.String()),
          }),
        ),
      ),
      interwiki: t.Optional(
        t.Array(
          t.Object({
            title: t.String(),
            iw: t.String(),
            url: t.Optional(t.String()),
          }),
        ),
      ),
    }),
  }),
])

export const MediaWikiRevisionsResponseSchema = t.Intersect([
  MediaWikiApiBaseResponseSchema,
  t.Object({
    query: t.Object({
      pages: t.Record(
        t.String(),
        t.Object({
          pageid: t.Number(),
          ns: t.Number(),
          title: t.String(),
          revisions: t.Array(MediaWikiRevisionSchema),
        }),
      ),
    }),
  }),
])
