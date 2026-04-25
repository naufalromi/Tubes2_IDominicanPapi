import type { TraversalLogEntry } from '../types'

type TraversalLogItemProps = {
  entry: TraversalLogEntry
}

function TraversalLogItem({ entry }: TraversalLogItemProps) {
  const getBadgeStyles = () => {
    if (entry.action === 'visit') {
      return {
        backgroundColor: '#1d4ed8',
        border: '1px solid #2563eb',
      }
    }

    if (entry.action === 'match') {
      return {
        backgroundColor: '#166534',
        border: '1px solid #22c55e',
      }
    }

    return {
      backgroundColor: '#2a2a2a',
      border: '1px solid #444',
    }
  }

  return (
    <div
      style={{
        padding: '12px 14px',
        borderRadius: '10px',
        backgroundColor: '#171717',
        border: '1px solid #2a2a2a',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '8px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ fontWeight: 600, color: 'white', fontSize: '14px' }}>
          {entry.action === 'skip' ? 'Not visited' : `Step ${entry.step}`}
        </div>

        <span
          style={{
            ...getBadgeStyles(),
            color: '#eee',
            padding: '4px 8px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
          }}
        >
          {entry.action}
        </span>
      </div>

      <div style={{ color: '#d4d4d4', fontSize: '14px', marginBottom: '6px' }}>
        {entry.message}
      </div>

      <div style={{ color: '#9ca3af', fontSize: '12px' }}>
        Node: {entry.nodeLabel}
      </div>
    </div>
  )
}

export default TraversalLogItem
