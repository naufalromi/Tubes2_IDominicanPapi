import DomTreeCanvas from '../../features/dom-tree/components/DomTreeCanvas'
import { useTraversalStore } from '../../store/traversalStore'

function MainPanel() {
  const tree = useTraversalStore((state) => state.tree)
  const matches = useTraversalStore((state) => state.matches)
  const traversalPath = useTraversalStore((state) => state.traversalPath)
  const status = useTraversalStore((state) => state.status)
  const error = useTraversalStore((state) => state.error)

  return (
    <main
      style={{
        flex: 1,
        backgroundColor: '#0f0f0f',
        padding: '20px',
        color: 'white',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'grid', gap: '16px', height: '100%' }}>
        {(status === 'loading' || error) && (
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '14px',
              border: error ? '1px solid #7f1d1d' : '1px solid #1d4ed8',
              backgroundColor: error ? '#2b1111' : '#0f1b36',
              color: error ? '#fca5a5' : '#bfdbfe',
              fontSize: '14px',
            }}
          >
            {error ?? 'Traversal is running. The DOM tree, logs, and results will update when it finishes.'}
          </div>
        )}

        <div style={{ flex: 1 }}>
          <DomTreeCanvas
            tree={tree}
            traversalPath={traversalPath}
            matchedNodeIds={matches.map((match) => match.id)}
          />
        </div>
      </div>
    </main>
  )
}

export default MainPanel
