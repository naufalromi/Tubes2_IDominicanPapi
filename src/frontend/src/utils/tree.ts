import type { DomNode } from '../types/dom'

export function countNodes(node: DomNode | null): number {
  if (!node) return 0

  return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0)
}

export function getMaxDepth(node: DomNode | null): number {
  if (!node) return 0
  if (node.children.length === 0) return node.depth

  return Math.max(...node.children.map(getMaxDepth))
}

export function flattenTree(node: DomNode | null): DomNode[] {
  if (!node) return []

  return [node, ...node.children.flatMap(flattenTree)]
}

export function findNodeById(node: DomNode | null, nodeId: string): DomNode | null {
  if (!node) return null
  if (node.id === nodeId) return node

  for (const child of node.children) {
    const found = findNodeById(child, nodeId)
    if (found) return found
  }

  return null
}

export function buildNodePath(node: DomNode | null, targetId: string): string[] {
  if (!node) return []

  if (node.id === targetId) {
    return node.tag === '#document' ? [] : [node.label]
  }

  for (const child of node.children) {
    const childPath = buildNodePath(child, targetId)

    if (childPath.length > 0) {
      return node.tag === '#document' ? childPath : [node.label, ...childPath]
    }
  }

  return []
}
