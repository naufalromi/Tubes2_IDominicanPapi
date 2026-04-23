function unwrapMatchingQuotes(value: string): string {
  if (value.length < 2) {
    return value
  }

  const firstChar = value[0]
  const lastChar = value[value.length - 1]

  if ((firstChar === '"' || firstChar === "'") && firstChar === lastChar) {
    return value.slice(1, -1)
  }

  return value
}

function decodeCommonEscapes(value: string): string {
  return value
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, '\\')
}

function looksLikeHtml(value: string): boolean {
  return /<[/a-zA-Z!][^>]*>/.test(value)
}

function looksLikeEscapedHtml(value: string): boolean {
  return looksLikeHtml(value) && /\\["'nrt\\]/.test(value)
}

export function normalizeHtmlInput(value: string): string {
  const trimmed = value.trim()

  if (trimmed.length === 0) {
    return trimmed
  }

  const unwrapped = unwrapMatchingQuotes(trimmed)

  if (!looksLikeEscapedHtml(unwrapped)) {
    return unwrapped
  }

  const decoded = decodeCommonEscapes(unwrapped)
  return looksLikeHtml(decoded) ? decoded : unwrapped
}
