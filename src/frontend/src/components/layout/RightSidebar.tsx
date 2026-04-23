import StatsPanel from '../../features/traversal-stats/components/StatsPanel'
import TraversalLogPanel from '../../features/traversal-log/components/TraversalLogPanel'
import ResultsPanel from '../../features/traversal-results/components/ResultsPanel'
import { useTraversalStore } from '../../store/traversalStore'

function RightSidebar() {
  const stats = useTraversalStore((state) => state.stats)
  const logs = useTraversalStore((state) => state.logs)
  const matches = useTraversalStore((state) => state.matches)

  return (
    <aside
      style={{
        width: '340px',
        backgroundColor: '#111',
        borderLeft: '1px solid #2a2a2a',
        padding: '24px',
        color: 'white',
        boxSizing: 'border-box',
        minHeight: 'calc(100vh - 81px)',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          display: 'grid',
          gap: '24px',
        }}
      >
        <StatsPanel stats={stats} />
        <TraversalLogPanel logs={logs} />
        <ResultsPanel matches={matches} />
      </div>
    </aside>
  )
}

export default RightSidebar
