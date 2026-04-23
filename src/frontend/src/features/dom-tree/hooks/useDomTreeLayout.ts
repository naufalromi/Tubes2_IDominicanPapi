import type {
  DomTreeEdge,
  DomTreeLayoutResult,
  DomTreeNodeData,
  PositionedDomTreeNode,
} from '../types'

const HORIZONTAL_GAP = 170
const VERTICAL_GAP = 120
const NODE_START_X = 120
const NODE_START_Y = 80

type TempNode = {
  id: string
  tag: string
  depth: number
  label?: string
  isMatched?: boolean
  isVisited?: boolean
  children: TempNode[]
  x: number
  y: number
}

function countNodes(node: DomTreeNodeData | null): number {
  if (!node) return 0
  return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0)
}

function getMaxDepth(node: DomTreeNodeData | null): number {
  if (!node) return 0
  if (node.children.length === 0) return node.depth
  return Math.max(...node.children.map(getMaxDepth))
}

function layoutTree(
  node: DomTreeNodeData,
  depth: number,
  nextXRef: { value: number },
): TempNode {
  if (node.children.length === 0) {
    const x = nextXRef.value
    const y = NODE_START_Y + depth * VERTICAL_GAP
    nextXRef.value += HORIZONTAL_GAP

    return {
      ...node,
      depth,
      x,
      y,
      children: [],
    }
  }

  const laidOutChildren = node.children.map((child) =>
    layoutTree(child, depth + 1, nextXRef),
  )

  const firstChild = laidOutChildren[0]
  const lastChild = laidOutChildren[laidOutChildren.length - 1]
  const x = (firstChild.x + lastChild.x) / 2
  const y = NODE_START_Y + depth * VERTICAL_GAP

  return {
    ...node,
    depth,
    x,
    y,
    children: laidOutChildren,
  }
}

function flattenNodes(node: TempNode): PositionedDomTreeNode[] {
  return [
    {
      id: node.id,
      tag: node.tag,
      depth: node.depth,
      label: node.label,
      isMatched: node.isMatched,
      isVisited: node.isVisited,
      children: [],
      x: node.x,
      y: node.y,
    },
    ...node.children.flatMap(flattenNodes),
  ]
}

function buildEdges(node: TempNode): DomTreeEdge[] {
  const currentEdges = node.children.map((child) => ({
    fromId: node.id,
    toId: child.id,
    x1: node.x,
    y1: node.y,
    x2: child.x,
    y2: child.y,
  }))

  return [...currentEdges, ...node.children.flatMap(buildEdges)]
}

export function useDomTreeLayout(tree: DomTreeNodeData | null): DomTreeLayoutResult {
  if (!tree) {
    return {
      nodes: [],
      edges: [],
      width: 0,
      height: 0,
      totalNodes: 0,
      maxDepth: 0,
    }
  }

  const nextXRef = { value: NODE_START_X }
  const laidOutTree = layoutTree(tree, 0, nextXRef)
  const nodes = flattenNodes(laidOutTree)
  const edges = buildEdges(laidOutTree)

  const maxX = Math.max(...nodes.map((node) => node.x))
  const maxY = Math.max(...nodes.map((node) => node.y))

  return {
    nodes,
    edges,
    width: maxX + 220,
    height: maxY + 180,
    totalNodes: countNodes(tree),
    maxDepth: getMaxDepth(tree),
  }
}