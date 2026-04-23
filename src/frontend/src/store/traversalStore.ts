import { useSyncExternalStore } from 'react'
import type { TraversalRequest } from '../types/api'
import type { DomNode } from '../types/dom'
import type {
  TraversalLogEntry,
  TraversalMatch,
  TraversalStats,
} from '../types/traversal'
import { runTraversal } from '../services/api/traversalApi'
import type {
  InputSource,
  ResultMode,
  TraversalAlgorithm,
  TraversalConfigState,
} from '../features/traversal-config/types'
import {
  isEmptySelector,
  isLikelyValidSelector,
  normalizeSelector,
} from '../utils/selector'
import { normalizeHtmlInput } from '../utils/html'

export type TraversalStatus = 'idle' | 'loading' | 'success' | 'error'

export type TraversalStoreState = {
  config: TraversalConfigState
  status: TraversalStatus
  error: string | null
  requestId: string | null
  resolvedUrl?: string
  tree: DomNode | null
  stats: TraversalStats
  logs: TraversalLogEntry[]
  matches: TraversalMatch[]
  traversalPath: string[]
}

const EMPTY_STATS: TraversalStats = {
  maxDepth: 0,
  nodesVisited: 0,
  traversalTimeMs: 0,
  matchesFound: 0,
}

const INITIAL_CONFIG: TraversalConfigState = {
  inputSource: 'url',
  url: '',
  html: '',
  algorithm: 'bfs',
  selector: '',
  resultMode: 'all',
  topN: 5,
}

const INITIAL_STATE: TraversalStoreState = {
  config: INITIAL_CONFIG,
  status: 'idle',
  error: null,
  requestId: null,
  resolvedUrl: undefined,
  tree: null,
  stats: EMPTY_STATS,
  logs: [],
  matches: [],
  traversalPath: [],
}

type Listener = () => void

let traversalStoreState = INITIAL_STATE
let latestRequestToken = 0
const listeners = new Set<Listener>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

function setState(
  updater: TraversalStoreState | ((currentState: TraversalStoreState) => TraversalStoreState),
) {
  traversalStoreState =
    typeof updater === 'function' ? updater(traversalStoreState) : updater
  emitChange()
}

function getState() {
  return traversalStoreState
}

function subscribe(listener: Listener) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return 'Traversal failed. Please try again.'
}

function updateConfig(
  patch:
    | Partial<TraversalConfigState>
    | ((config: TraversalConfigState) => Partial<TraversalConfigState>),
) {
  setState((currentState) => {
    const nextPatch =
      typeof patch === 'function' ? patch(currentState.config) : patch

    return {
      ...currentState,
      error: null,
      config: {
        ...currentState.config,
        ...nextPatch,
      },
    }
  })
}

function buildTraversalRequest(config: TraversalConfigState): TraversalRequest {
  const selector = normalizeSelector(config.selector)
  const topN = Math.max(1, Math.floor(config.topN || 0))

  if (isEmptySelector(selector)) {
    throw new Error('CSS selector is required before starting traversal.')
  }

  if (!isLikelyValidSelector(selector)) {
    throw new Error('CSS selector format looks invalid. Please review it and try again.')
  }

  if (config.resultMode === 'topn' && config.topN < 1) {
    throw new Error('Top N must be at least 1.')
  }

  if (config.inputSource === 'url') {
    const url = config.url.trim()

    if (url.length === 0) {
      throw new Error('Please enter a website URL.')
    }

    try {
      new URL(url)
    } catch {
      throw new Error('Please enter a valid URL, including http:// or https://.')
    }

    return {
      inputSource: 'url',
      url,
      algorithm: config.algorithm,
      selector,
      resultMode: config.resultMode,
      topN: config.resultMode === 'topn' ? topN : undefined,
    }
  }

  const html = normalizeHtmlInput(config.html)

  if (html.length === 0) {
    throw new Error('Please paste HTML content before starting traversal.')
  }

  return {
    inputSource: 'html',
    html,
    algorithm: config.algorithm,
    selector,
    resultMode: config.resultMode,
    topN: config.resultMode === 'topn' ? topN : undefined,
  }
}

export const traversalStoreActions = {
  setInputSource(inputSource: InputSource) {
    updateConfig({ inputSource })
  },

  setUrl(url: string) {
    updateConfig({ url })
  },

  setHtml(html: string) {
    updateConfig({ html })
  },

  setAlgorithm(algorithm: TraversalAlgorithm) {
    updateConfig({ algorithm })
  },

  setSelector(selector: string) {
    updateConfig({ selector })
  },

  setResultMode(resultMode: ResultMode) {
    updateConfig((config) => ({
      resultMode,
      topN: resultMode === 'topn' ? Math.max(1, config.topN) : config.topN,
    }))
  },

  setTopN(topN: number) {
    updateConfig({ topN })
  },

  resetResults() {
    setState((currentState) => ({
      ...currentState,
      status: 'idle',
      error: null,
      requestId: null,
      resolvedUrl: undefined,
      tree: null,
      stats: EMPTY_STATS,
      logs: [],
      matches: [],
      traversalPath: [],
    }))
  },

  async startTraversal() {
    let request: TraversalRequest

    try {
      request = buildTraversalRequest(getState().config)
    } catch (error) {
      setState((currentState) => ({
        ...currentState,
        status: 'error',
        error: getErrorMessage(error),
      }))
      return
    }

    const requestToken = ++latestRequestToken

    setState((currentState) => ({
      ...currentState,
      status: 'loading',
      error: null,
    }))

    try {
      const response = await runTraversal(request)

      if (requestToken !== latestRequestToken) {
        return
      }

      setState((currentState) => ({
        ...currentState,
        status: 'success',
        error: null,
        requestId: response.requestId,
        resolvedUrl: response.resolvedUrl,
        tree: response.tree,
        stats: response.stats,
        logs: response.logs,
        matches: response.matches,
        traversalPath: response.traversalPath,
      }))
    } catch (error) {
      if (requestToken !== latestRequestToken) {
        return
      }

      setState((currentState) => ({
        ...currentState,
        status: 'error',
        error: getErrorMessage(error),
      }))
    }
  },
}

export function useTraversalStore<T>(selector: (state: TraversalStoreState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getState()),
    () => selector(getState()),
  )
}
