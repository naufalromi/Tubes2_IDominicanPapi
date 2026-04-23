export type DomTreeNodeData = {
  id: string
  tag: string
  depth: number
  label?: string
  isMatched?: boolean
  isVisited?: boolean
  children: DomTreeNodeData[]
}

export type DomTreeLegendItem = {
  label: string
  color: string
}

export type PositionedDomTreeNode = DomTreeNodeData & {
  x: number
  y: number
}

export type DomTreeEdge = {
  fromId: string
  toId: string
  x1: number
  y1: number
  x2: number
  y2: number
}

export type DomTreeLayoutResult = {
  nodes: PositionedDomTreeNode[]
  edges: DomTreeEdge[]
  width: number
  height: number
  totalNodes: number
  maxDepth: number
}