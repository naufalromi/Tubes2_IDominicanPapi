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
  tree: DomNode | null
  stats: TraversalStats
  logs: TraversalLogEntry[]
  matches: TraversalMatch[]
  traversalPath: string[]
}