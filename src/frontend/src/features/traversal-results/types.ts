export type MatchResult = {
  id: string
  tag: string
  label: string
  path: string
  depth: number
  attributes?: Record<string, string>
  textPreview?: string
}