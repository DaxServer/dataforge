import type {
  Label,
  ColumnMapping,
  StatementSchemaMapping,
  TermsSchemaMapping,
  PropertyReference,
  ValueMapping,
  StatementRank,
  PropertyValueMap,
  ReferenceSchemaMapping,
  ItemSchema,
} from '@backend/api/project/project.wikibase'
import type { UUID } from 'crypto'

/**
 * Composable for building and constructing complete schema objects
 */
export const useSchemaBuilder = () => {
  /**
   * Constructs a complete WikibaseSchemaMapping
   */
  const buildSchema = (
    id: UUID,
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
      id,
      projectId,
      name,
      wikibase: wikibaseUrl,
      schema: buildItemSchema(labels, descriptions, aliases, statements),
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
  ): ItemSchema => {
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
    references: ReferenceSchemaMapping[] = [],
  ): StatementSchemaMapping => {
    return {
      id: crypto.randomUUID(),
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
