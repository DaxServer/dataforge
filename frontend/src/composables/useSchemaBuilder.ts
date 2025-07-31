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
      id: crypto.randomUUID(),
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
      crypto.randomUUID(),
      projectId,
      'Untitled Schema',
      wikibaseUrl,
      {},
      {},
      {},
      [],
    )
  }

  return {
    buildSchema,
    buildItemSchema,
    buildTermsSchema,
    buildStatement,
    createEmptySchema,
  }
}
