export type TraversalAlgorithm = 'bfs' | 'dfs'
export type InputSource = 'url' | 'html'
export type ResultMode = 'all' | 'topn'

export type TraversalStats = {
  maxDepth: number
  nodesVisited: number
  traversalTimeMs: number
  matchesFound: number
}

export type TraversalLogAction = 'visit' | 'match' | 'skip'

export type TraversalLogEntry = {
  id: string
  step: number
  nodeId: string
  nodeLabel: string
  action: TraversalLogAction
  message: string
}

export type TraversalMatch = {
  id: string
  tag: string
  label: string
  path: string
  depth: number
  attributes?: Record<string, string>
  textPreview?: string
}