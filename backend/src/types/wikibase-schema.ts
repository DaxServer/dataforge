import { t } from 'elysia'

export const ItemId = t.TemplateLiteral([
  t.Literal('Q'),
  t.Number({
    min: 1,
  }),
])
export type ItemId = typeof ItemId.static

export const PropertyId = t.TemplateLiteral([
  t.Literal('P'),
  t.Number({
    min: 1,
  }),
])
export type PropertyId = typeof PropertyId.static

export const StatementRank = t.Union([
  t.Literal('preferred'),
  t.Literal('normal'),
  t.Literal('deprecated'),
])
export type StatementRank = typeof StatementRank.static

export const WikibaseDataType = t.Union([
  t.Literal('string'),
  t.Literal('wikibase-item'),
  t.Literal('wikibase-property'),
  t.Literal('quantity'),
  t.Literal('time'),
  t.Literal('globe-coordinate'),
  t.Literal('url'),
  t.Literal('external-id'),
  t.Literal('monolingualtext'),
  t.Literal('commonsMedia'),
])
export type WikibaseDataType = typeof WikibaseDataType.static
