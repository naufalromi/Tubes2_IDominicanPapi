import type { TraversalLogAction } from '../types'

type TraversalLogFiltersProps = {
  value: 'all' | TraversalLogAction
  onChange: (value: 'all' | TraversalLogAction) => void
}

function TraversalLogFilters({
  value,
  onChange,
}: TraversalLogFiltersProps) {
  const options: Array<{ label: string; value: 'all' | TraversalLogAction }> = [
    { label: 'All', value: 'all' },
    { label: 'Visit', value: 'visit' },
    { label: 'Match', value: 'match' },
    { label: 'Skip', value: 'skip' },
  ]

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        marginBottom: '16px',
      }}
    >
      {options.map((option) => {
        const isActive = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: isActive ? 'none' : '1px solid #333',
              backgroundColor: isActive ? '#2563eb' : '#1d1d1d',
              color: isActive ? 'white' : '#ccc',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export default TraversalLogFilters