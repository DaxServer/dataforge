import z from 'zod'

export const ItemId = z.templateLiteral([z.literal('Q'), z.number()])
export type ItemId = z.infer<typeof ItemId>

export const PropertyId = z.templateLiteral([z.literal('P'), z.number()])
export type PropertyId = z.infer<typeof PropertyId>

export const StatementRank = z.union([
  z.literal('preferred'),
  z.literal('normal'),
  z.literal('deprecated'),
])
export type StatementRank = z.infer<typeof StatementRank>

export const WikibaseDataType = z.union([
  z.literal('string'),
  z.literal('wikibase-item'),
  z.literal('wikibase-property'),
  z.literal('quantity'),
  z.literal('time'),
  z.literal('globe-coordinate'),
  z.literal('url'),
  z.literal('external-id'),
  z.literal('monolingualtext'),
  z.literal('commonsMedia'),
])
export type WikibaseDataType = z.infer<typeof WikibaseDataType>
