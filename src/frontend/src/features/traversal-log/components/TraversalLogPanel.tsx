import { useMemo, useState } from 'react'
import TraversalLogFilters from './TraversalLogFilters'
import TraversalLogItem from './TraversalLogItem'
import type { TraversalLogAction, TraversalLogEntry } from '../types'

type TraversalLogPanelProps = {
  logs?: TraversalLogEntry[]
}

function TraversalLogPanel({ logs = [] }: TraversalLogPanelProps) {
  const [filter, setFilter] = useState<'all' | TraversalLogAction>('all')

  const filteredLogs = useMemo(() => {
    if (filter === 'all') return logs
    return logs.filter((log) => log.action === filter)
  }, [logs, filter])

  return (
    <div
      style={{
        backgroundColor: '#111',
        color: 'white',
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
          Traversal Log
        </h2>
        <p
          style={{
            margin: '6px 0 0',
            color: '#aaa',
            fontSize: '14px',
          }}
        >
          Step-by-step traversal events
        </p>
      </div>

      <TraversalLogFilters value={filter} onChange={setFilter} />

      {filteredLogs.length === 0 ? (
        <div
          style={{
            padding: '18px',
            borderRadius: '14px',
            backgroundColor: '#1d1d1d',
            border: '1px solid #2d2d2d',
            color: '#888',
            textAlign: 'center',
          }}
        >
          No log entries available
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gap: '12px',
            maxHeight: '420px',
            overflowY: 'auto',
          }}
        >
          {filteredLogs.map((entry) => (
            <TraversalLogItem key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}

export default TraversalLogPanel