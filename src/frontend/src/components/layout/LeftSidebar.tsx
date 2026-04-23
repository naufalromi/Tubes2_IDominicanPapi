import TraversalConfigPanel from '../../features/traversal-config/components/TraversalConfigPanel'

function LeftSidebar() {
  return (
    <aside
      style={{
        width: '360px',
        backgroundColor: '#111',
        borderRight: '1px solid #2a2a2a',
        color: 'white',
        boxSizing: 'border-box',
        padding: '24px',
        minHeight: 'calc(100vh - 81px)',
        overflowY: 'auto',
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom: '24px',
          fontSize: '18px',
          fontWeight: 700,
        }}
      >
        Traversal Configuration
      </h2>

      <TraversalConfigPanel />
    </aside>
  )
}

export default LeftSidebar