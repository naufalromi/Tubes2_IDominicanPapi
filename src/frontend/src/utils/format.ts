export function formatDuration(durationMs: number): string {
  if (durationMs < 1000) {
    return `${durationMs} ms`
  }

  return `${(durationMs / 1000).toFixed(2)} s`
}

export function formatNodeLabel(tag: string, attributes?: Record<string, string>): string {
  if (!attributes || Object.keys(attributes).length === 0) {
    return `<${tag}>`
  }

  const id = attributes.id ? ` id="${attributes.id}"` : ''
  const className = attributes.class ? ` class="${attributes.class}"` : ''

  return `<${tag}${id}${className}>`
}

export function truncateText(text: string, maxLength = 50): string {
  if (text.length <= maxLength) {
    return text
  }

  return `${text.slice(0, maxLength)}...`
}