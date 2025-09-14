import z from 'zod'

export const ItemId = z
  .string()
  .regex(/^Q[1-9]\d*$/)
  .transform((val) => val as ItemId)
export type ItemId = `Q${number}`

export const PropertyId = z
  .string()
  .regex(/^P[1-9]\d*$/)
  .transform((val) => val as PropertyId)
export type PropertyId = `P${number}`

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
