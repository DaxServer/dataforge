import type { WikibaseDataType } from '@frontend/types/wikibase-schema'

/**
 * Mapping between database column data types and compatible Wikibase data types.
 * This mapping defines which database types can be converted to which Wikibase types.
 */
export const DATA_TYPE_COMPATIBILITY_MAP: Record<string, WikibaseDataType[]> = {
    VARCHAR: ['string', 'url', 'external-id', 'monolingualtext'],
    TEXT: ['string', 'monolingualtext'],
    STRING: ['string', 'url', 'external-id', 'monolingualtext'],
    INTEGER: ['quantity'],
    DECIMAL: ['quantity'],
    NUMERIC: ['quantity'],
    FLOAT: ['quantity'],
    DOUBLE: ['quantity'],
    DATE: ['time'],
    DATETIME: ['time'],
    TIMESTAMP: ['time'],
    BOOLEAN: [],
    JSON: ['string'], // JSON can be serialized to string
    ARRAY: ['string'], // Arrays can be serialized to string
} as const

/**
 * Helper function to get compatible Wikibase data types for a given database column type
 * @param columnType - The database column data type
 * @returns Array of compatible Wikibase data types
 */
export const getCompatibleWikibaseTypes = (columnType: string): WikibaseDataType[] => {
    return DATA_TYPE_COMPATIBILITY_MAP[columnType.toUpperCase()] || []
}

/**
 * Helper function to check if a column type is compatible with any of the accepted types
 * @param columnType - The database column data type
 * @param acceptedTypes - Array of accepted Wikibase data types
 * @returns True if the column type is compatible with any of the accepted types
 */
export const isDataTypeCompatible = (
    columnType: string,
    acceptedTypes: WikibaseDataType[],
): boolean => {
    const compatibleTypes = getCompatibleWikibaseTypes(columnType)
    return acceptedTypes.some((type) => compatibleTypes.includes(type))
}
