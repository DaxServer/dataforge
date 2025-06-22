import linkifyIt from 'linkify-it'

const linkify = new linkifyIt()

export const useLinkify = () => {
  const linkifyText = (text: string) => {
    const matches = linkify.match(text)

    if (!matches) {
      return text
    }

    let lastIndex = 0,
      result = ''

    for (const match of matches) {
      result += text.substring(lastIndex, match.index)
      result += `<a href="${match.url}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">${match.text}</a>`
      lastIndex = match.lastIndex
    }
    result += text.substring(lastIndex, text.length)

    return result
  }

  return { linkifyText }
}
