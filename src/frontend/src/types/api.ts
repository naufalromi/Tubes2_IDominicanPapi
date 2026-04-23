import type { DomNode } from './dom'
import type {
  InputSource,
  ResultMode,
  TraversalAlgorithm,
  TraversalLogEntry,
  TraversalMatch,
  TraversalStats,
} from './traversal'

export type TraversalRequest = {
  inputSource: InputSource
  url?: string
  html?: string
  algorithm: TraversalAlgorithm
  selector: string
  resultMode: ResultMode
  topN?: number
}

export type TraversalResponse = {
  requestId: string
  sourceType: InputSource
  resolvedUrl?: string
  selector: string
  algorithm: TraversalAlgorithm
  resultMode: ResultMode
  tree: DomNode | null
  stats: TraversalStats
  logs: TraversalLogEntry[]
  matches: TraversalMatch[]
  traversalPath: string[]
}

export type BackendResultMode = 'all' | 'top_n'

export type BackendSearchRequest = {
  source: {
    type: InputSource
    value: string
  }
  algorithm: TraversalAlgorithm
  selector: string
  result_mode: BackendResultMode
  limit: number
  include_tree: boolean
  include_log: boolean
}

export type BackendDomNode = {
  node_id: string
  tag: string
  data?: string
  attributes: Record<string, string>
  children: BackendDomNode[]
}

export type BackendTraversalLogEntry = {
  step: number
  node_id: string
  parent_id: string
  depth: number
  tag: string
  action: string
  matched: boolean
}

export type BackendMatchInfo = {
  node_id: string
  tag: string
  attributes: Record<string, string>
  text_preview: string
  path: string[]
}

export type BackendSearchResponse = {
  request_id: string
  source_info: {
    type: InputSource
    resolved_url?: string
  }
  selector: string
  algorithm: TraversalAlgorithm
  result_mode: BackendResultMode
  limit?: number
  stats: {
    visited_nodes: number
    matched_nodes: number
    max_depth: number
    search_time_ms: number
  }
  matches: BackendMatchInfo[]
  traversal_path: string[]
  dom_tree?: BackendDomNode | null
  traversal_log?: BackendTraversalLogEntry[]
}
