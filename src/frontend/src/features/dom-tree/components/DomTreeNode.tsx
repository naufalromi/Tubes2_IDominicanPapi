import type { PositionedDomTreeNode } from '../types'

type DomTreeNodeProps = {
  node: PositionedDomTreeNode
  isVisited: boolean
  isMatched: boolean
}

function DomTreeNode({ node, isVisited, isMatched }: DomTreeNodeProps) {
  const backgroundColor = isMatched
    ? '#15803d'
    : isVisited
      ? '#2563eb'
      : '#2d2d2d'

  return (
    <div
      style={{
        position: 'absolute',
        left: node.x,
        top: node.y,
        transform: 'translate(-50%, -50%)',
        minWidth: '64px',
        maxWidth: '220px',
        padding: '10px 18px',
        borderRadius: '999px',
        backgroundColor,
        color: 'white',
        border: '2px solid rgba(255,255,255,0.1)',
        textAlign: 'center',
        fontWeight: 600,
        fontSize: '13px',
        whiteSpace: 'nowrap',
        boxShadow: '0 8px 18px rgba(0,0,0,0.28)',
        userSelect: 'none',
        transition: 'background-color 0.25s ease, transform 0.25s ease',
      }}
    >
      {node.label ?? node.tag}
    </div>
  )
}

export default DomTreeNode