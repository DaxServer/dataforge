export const usePropertyValueDisplay = () => {
  const getPropertyDisplayText = (property: PropertyReference): string => {
    return property.label || property.id
  }

  const getValueDisplayText = (value: ValueMapping): string => {
    if (value.type === 'column') {
      return typeof value.source === 'string' ? value.source : value.source.columnName
    }
    return typeof value.source === 'string' ? value.source : 'No mapping'
  }

  return {
    getPropertyDisplayText,
    getValueDisplayText,
  }
}
