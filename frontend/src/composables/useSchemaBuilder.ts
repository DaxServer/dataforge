import type {
  WikibaseSchemaMapping,
  ItemSchemaMapping,
  TermsSchemaMapping,
  StatementSchemaMapping,
  Label,
  ColumnMapping,
  PropertyReference,
  ValueMapping,
  StatementRank,
} from '@frontend/types/wikibase-schema'

/**
 * Composable for building and constructing complete schema objects
 */
export const useSchemaBuilder = () => {
  /**
   * Constructs a complete WikibaseSchemaMapping
   */
  const buildSchema = (
    id: string,
    projectId: string,
    name: string,
    wikibaseUrl: string,
    labels: Label,
    descriptions: Label,
    aliases: Record<string, ColumnMapping[]>,
    statements: StatementSchemaMapping[],
    createdAt?: string,
    updatedAt?: string,
  ): WikibaseSchemaMapping => {
    const now = new Date().toISOString()

    return {
      id,
      projectId,
      name,
      wikibase: wikibaseUrl,
      item: buildItemSchema(labels, descriptions, aliases, statements),
      createdAt: createdAt ?? now,
      updatedAt: updatedAt ?? now,
    }
  }

  /**
   * Constructs an ItemSchemaMapping from terms and statements
   */
  const buildItemSchema = (
    labels: Label,
    descriptions: Label,
    aliases: Record<string, ColumnMapping[]>,
    statements: StatementSchemaMapping[],
  ): ItemSchemaMapping => {
    return {
      terms: buildTermsSchema(labels, descriptions, aliases),
      statements,
    }
  }

  /**
   * Constructs a TermsSchemaMapping from individual term mappings
   */
  const buildTermsSchema = (
    labels: Label,
    descriptions: Label,
    aliases: Record<string, ColumnMapping[]>,
  ): TermsSchemaMapping => {
    return {
      labels,
      descriptions,
      aliases,
    }
  }

  /**
   * Creates a new statement schema mapping
   */
  const buildStatement = (
    property: PropertyReference,
    valueMapping: ValueMapping,
    rank: StatementRank = 'normal',
  ): StatementSchemaMapping => {
    return {
      id: Bun.randomUUIDv7(),
      property,
      value: valueMapping,
      rank,
      qualifiers: [],
      references: [],
    }
  }

  /**
   * Creates a new empty schema with default values
   */
  const createEmptySchema = (projectId: string, wikibaseUrl: string): WikibaseSchemaMapping => {
    return buildSchema(
      Bun.randomUUIDv7(),
      projectId,
      'Untitled Schema',
      wikibaseUrl,
      {},
      {},
      {},
      [],
    )
  }

  const parseSchema = (schema: WikibaseSchemaMapping) => {
    return {
      id: schema.id,
      projectId: schema.projectId,
      name: schema.name,
      wikibase: schema.wikibase,
      labels: schema.item.terms.labels,
      descriptions: schema.item.terms.descriptions,
      aliases: schema.item.terms.aliases,
      statements: schema.item.statements,
      createdAt: schema.createdAt,
      updatedAt: schema.updatedAt,
    }
  }

  return {
    buildSchema,
    buildItemSchema,
    buildTermsSchema,
    buildStatement,
    createEmptySchema,
    parseSchema,
  }
}
