import StatCard from './StatCard'
import type { TraversalStats } from '../types'

type StatsPanelProps = {
  stats?: TraversalStats
}

const demoStats: TraversalStats = {
  maxDepth: 8,
  nodesVisited: 142,
  traversalTimeMs: 12.4,
  matchesFound: 6,
}

function StatsPanel({ stats = demoStats }: StatsPanelProps) {
  return (
    <section
      style={{
        height: '100%',
        backgroundColor: '#151515',
        border: '1px solid #2a2a2a',
        borderRadius: '16px',
        padding: '16px',
        boxSizing: 'border-box',
        color: 'white',
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <h2
          style={{
            margin: 0,
            fontSize: '18px',
          }}
        >
          Traversal Statistics
        </h2>

        <p
          style={{
            margin: '6px 0 0',
            fontSize: '13px',
            color: '#9ca3af',
          }}
        >
          Summary of the latest DOM traversal run
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gap: '12px',
        }}
      >
        <StatCard label="Max Depth" value={stats.maxDepth} />
        <StatCard label="Nodes Visited" value={stats.nodesVisited} />
        <StatCard label="Traversal Time" value={`${stats.traversalTimeMs} ms`} />
        <StatCard label="Matches Found" value={stats.matchesFound} />
      </div>
    </section>
  )
}

export default StatsPanel