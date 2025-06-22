export const useLineBreak = () => {
  const replaceLineBreaks = (text: string): string => {
    if (!text) {
      return text
    }
    return text.replace(/\n/g, '<br>')
  }

  return { replaceLineBreaks }
}
