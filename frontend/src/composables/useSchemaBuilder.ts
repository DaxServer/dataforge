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
  PropertyValueMap,
} from '@frontend/types/wikibase-schema'
import type { UUID } from 'crypto'

/**
 * Composable for building and constructing complete schema objects
 */
export const useSchemaBuilder = () => {
  /**
   * Constructs a complete WikibaseSchemaMapping
   */
  const buildSchema = (
    id: string,
    projectId: UUID,
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
      id: id as UUID,
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
    qualifiers: PropertyValueMap[] = [],
    references: PropertyValueMap[] = [],
  ): StatementSchemaMapping => {
    return {
      id: crypto.randomUUID() as UUID,
      property,
      value: valueMapping,
      rank,
      qualifiers,
      references,
    }
  }

  /**
   * Creates a new empty schema with default values
   */
  const createEmptySchema = (projectId: UUID, wikibaseUrl: string): WikibaseSchemaMapping => {
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
