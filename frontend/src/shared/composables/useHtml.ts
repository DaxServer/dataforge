import escapeHtml from 'escape-html'
import linkifyIt from 'linkify-it'

export const useHtml = () => {
  const linkify = new linkifyIt()

  const processHtml = (text?: string) => {
    if (!text) {
      return ''
    }

    // First escape HTML entities to prevent HTML injection
    let processedText = escapeHtml(text)

    // Replace newlines with <br> tags
    processedText = processedText.replace(/\n/g, '<br>')

    const matches = linkify.match(processedText)

    if (!matches) {
      return processedText
    }

    let lastIndex = 0,
      result = ''

    for (const match of matches) {
      result += processedText.substring(lastIndex, match.index)
      result += `<a href="${match.url}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">${match.text}</a>`
      lastIndex = match.lastIndex
    }
    result += processedText.substring(lastIndex, processedText.length)

    return result
  }

  return { processHtml }
}
