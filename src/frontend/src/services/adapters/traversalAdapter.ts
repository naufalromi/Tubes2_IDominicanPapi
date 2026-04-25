import type {
  BackendDomNode,
  BackendSearchRequest,
  BackendSearchResponse,
  BackendTraversalLogEntry,
  TraversalRequest,
  TraversalResponse,
} from '../../types/api'
import type { DomNode } from '../../types/dom'
import type {
  TraversalLogAction,
  TraversalLogEntry,
  TraversalMatch,
  TraversalStats,
} from '../../types/traversal'
import { formatNodeLabel, truncateText } from '../../utils/format'
import {
  buildNodePath,
  countNodes,
  findNodeById,
  flattenTree,
  getMaxDepth,
} from '../../utils/tree'

function buildDomNodeLabel(node: Pick<BackendDomNode, 'tag' | 'attributes' | 'data'>): string {
  if (node.tag === '#document') {
    return '#document'
  }

  if (node.tag === '#text') {
    return `#text "${truncateText(node.data?.trim() ?? '', 24)}"`
  }

  if (node.tag === '#comment') {
    return `<!-- ${truncateText(node.data?.trim() ?? '', 24)} -->`
  }

  return formatNodeLabel(node.tag, node.attributes)
}

function adaptDomNode(node: BackendDomNode, depth = 0): DomNode {
  const children = node.children ?? []

  return {
    id: node.node_id,
    tag: node.tag,
    label: buildDomNodeLabel(node),
    depth,
    attributes: node.attributes,
    textContent: node.data?.trim() || undefined,
    children: children.map((child) => adaptDomNode(child, depth + 1)),
  }
}

function adaptResultMode(resultMode: TraversalRequest['resultMode']): BackendSearchRequest['result_mode'] {
  return resultMode === 'topn' ? 'top_n' : 'all'
}

function mapLogAction(entry: BackendTraversalLogEntry): TraversalLogAction {
  if (entry.action === 'MATCH FOUND' || entry.matched) {
    return 'match'
  }

  return 'visit'
}

function buildLogMessage(entry: BackendTraversalLogEntry, nodeLabel: string, path: string): string {
  if (entry.action === 'MATCH FOUND') {
    return `Selector matched ${nodeLabel} at depth ${entry.depth}.`
  }

  if (entry.matched) {
    return `Matched an intermediate selector segment at ${nodeLabel}.`
  }

  if (path.length > 0) {
    return `Visited ${nodeLabel} on ${path}.`
  }

  return `Visited ${nodeLabel} at depth ${entry.depth}.`
}

function resolveNodePath(tree: DomNode | null, nodeId: string, fallbackPath: string[] = []): string {
  const treePath = buildNodePath(tree, nodeId)

  if (treePath.length > 0) {
    return treePath.join(' > ')
  }

  if (fallbackPath.length > 0) {
    return fallbackPath.join(' > ')
  }

  return ''
}

function adaptMatches(
  tree: DomNode | null,
  matches: BackendSearchResponse['matches'],
): TraversalMatch[] {
  return (matches ?? []).map((match) => {
    const node = findNodeById(tree, match.node_id)
    const path = resolveNodePath(tree, match.node_id, match.path ?? [])

    return {
      id: match.node_id,
      tag: match.tag,
      label: node?.label ?? formatNodeLabel(match.tag, match.attributes),
      path,
      depth: Math.max((match.path ?? []).length - 1, node?.depth ?? 0),
      attributes: match.attributes,
      textPreview: match.text_preview ? truncateText(match.text_preview, 120) : undefined,
    }
  })
}

function adaptLogs(
  tree: DomNode | null,
  logs: BackendSearchResponse['traversal_log'],
): TraversalLogEntry[] {
  const backendLogs = logs ?? []
  const adaptedLogs = backendLogs.map((entry) => {
    const node = findNodeById(tree, entry.node_id)
    const nodeLabel = node?.label ?? formatNodeLabel(entry.tag)
    const path = resolveNodePath(tree, entry.node_id)

    return {
      id: `${entry.node_id}-${entry.step}`,
      step: entry.step,
      nodeId: entry.node_id,
      nodeLabel,
      action: mapLogAction(entry),
      message: buildLogMessage(entry, nodeLabel, path),
    }
  })

  const visitedNodeIds = new Set(backendLogs.map((entry) => entry.node_id))
  const lastStep = backendLogs.reduce((maxStep, entry) => Math.max(maxStep, entry.step), 0)
  const skippedLogs = flattenTree(tree)
    .filter((node) => node.tag !== '#document' && !visitedNodeIds.has(node.id))
    .map((node, index): TraversalLogEntry => ({
      id: `${node.id}-skip`,
      step: lastStep + index + 1,
      nodeId: node.id,
      nodeLabel: node.label,
      action: 'skip',
      message: `Skipped ${node.label}; it was not visited during this traversal.`,
    }))

  return [...adaptedLogs, ...skippedLogs]
}

export function adaptTraversalRequest(request: TraversalRequest): BackendSearchRequest {
  const sourceValue = request.inputSource === 'url' ? request.url?.trim() ?? '' : request.html ?? ''

  return {
    source: {
      type: request.inputSource,
      value: sourceValue,
    },
    algorithm: request.algorithm,
    selector: request.selector,
    result_mode: adaptResultMode(request.resultMode),
    limit: request.resultMode === 'topn' ? request.topN ?? 0 : 0,
    include_tree: true,
    include_log: true,
  }
}

export function adaptTraversalResponse(response: BackendSearchResponse): TraversalResponse {
  const tree = response.dom_tree ? adaptDomNode(response.dom_tree) : null
  const matches = adaptMatches(tree, response.matches)
  const logs = adaptLogs(tree, response.traversal_log)

  const stats: TraversalStats = {
    maxDepth: response.stats.max_depth || getMaxDepth(tree),
    nodesVisited: response.stats.visited_nodes || countNodes(tree),
    traversalTimeMs: response.stats.search_time_ms,
    matchesFound: response.stats.matched_nodes || matches.length,
  }

  return {
    requestId: response.request_id,
    sourceType: response.source_info.type,
    resolvedUrl: response.source_info.resolved_url,
    selector: response.selector,
    algorithm: response.algorithm,
    resultMode: response.result_mode === 'top_n' ? 'topn' : 'all',
    tree,
    stats,
    logs,
    matches,
    traversalPath: response.traversal_path ?? [],
  }
}
