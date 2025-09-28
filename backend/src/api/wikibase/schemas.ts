import { WikibaseDataType } from '@backend/types/wikibase-schema'
import { t } from 'elysia'

export const OAuthCredentials = t.Object({
  consumerKey: t.String({
    description: 'Consumer key',
  }),
  consumerSecret: t.String({
    description: 'Consumer secret',
  }),
  accessToken: t.String({
    description: 'Access token',
  }),
  accessTokenSecret: t.String({
    description: 'Access secret',
  }),
})
export type OAuthCredentials = typeof OAuthCredentials.static

export const CSRFTokenResponse = t.Object({
  query: t.Object({
    tokens: t.Object({
      csrftoken: t.String(),
    }),
  }),
})
export type CSRFTokenResponse = typeof CSRFTokenResponse.static

export const Term = t.Union([t.Literal('label'), t.Literal('alias'), t.Literal('description')])
export type Term = typeof Term.static

export const PropertySearchResultSchema = t.Object({
  id: t.String(),
  title: t.String(),
  pageid: t.Number(),
  datatype: WikibaseDataType,
  label: t.String(),
  description: t.String(),
  aliases: t.Array(t.String()),
  match: t.Object({
    type: Term,
    language: t.String(),
    text: t.String(),
  }),
})
export type PropertySearchResult = typeof PropertySearchResultSchema.static

export const InstanceId = t.Union([t.Literal('wikidata'), t.Literal('commons')])
export type InstanceId = typeof InstanceId.static

export const QuerySchema = t.Object({
  q: t.String({
    minLength: 1,
    description: 'Search query for properties',
  }),
  limit: t.Number({
    default: 10,
    description: 'Maximum number of results',
  }),
  offset: t.Number({
    default: 0,
    description: 'Offset for pagination',
  }),
  language: t.String({
    default: 'en',
    description: 'Language code for search results',
  }),
  languageFallback: t.Optional(
    t.Boolean({
      default: true,
      description: 'Enable language fallback for partial matches',
    }),
  ),
})
