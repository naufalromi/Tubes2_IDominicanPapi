export function normalizeSelector(selector: string): string {
  return selector.trim().replace(/\s+/g, ' ')
}

export function isEmptySelector(selector: string): boolean {
  return normalizeSelector(selector).length === 0
}

export function isLikelyValidSelector(selector: string): boolean {
  const normalized = normalizeSelector(selector)

  if (normalized.length === 0) return false

  const invalidPatterns = ['>>', '##', '..', '{{', '}}']

  return !invalidPatterns.some((pattern) => normalized.includes(pattern))
}