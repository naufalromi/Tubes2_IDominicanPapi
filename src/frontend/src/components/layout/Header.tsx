import Badge from '../ui/Badge'
import { useTraversalStore } from '../../store/traversalStore'

function Header() {
  const status = useTraversalStore((state) => state.status)
  const requestId = useTraversalStore((state) => state.requestId)

  const badgeVariant =
    status === 'success' ? 'green' : status === 'loading' ? 'blue' : 'gray'
  const statusLabel =
    status === 'loading'
      ? 'Searching'
      : status === 'success'
        ? 'Results Ready'
        : status === 'error'
          ? 'Needs Attention'
          : 'Idle'

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        borderBottom: '1px solid #2a2a2a',
        backgroundColor: '#111',
        color: 'white',
      }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: '24px' }}>DOM Tree Traversal Visualizer</h1>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#aaa' }}>
          BFS and DFS CSS Selector Search
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          justifyItems: 'end',
          gap: '8px',
        }}
      >
        <Badge variant={badgeVariant}>{statusLabel}</Badge>
        <div style={{ fontSize: '12px', color: '#888' }}>
          {requestId ? `Request ${requestId}` : 'Awaiting first traversal'}
        </div>
      </div>
    </header>
  )
}

export default Header
