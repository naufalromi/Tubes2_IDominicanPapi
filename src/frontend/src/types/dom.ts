export type DomAttributes = Record<string, string>

export type DomNode = {
  id: string
  tag: string
  label: string
  depth: number
  attributes?: DomAttributes
  textContent?: string
  children: DomNode[]
}