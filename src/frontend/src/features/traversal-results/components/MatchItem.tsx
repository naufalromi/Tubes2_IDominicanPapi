import type { MatchResult } from '../types'

type MatchItemProps = {
  match: MatchResult
}

function MatchItem({ match }: MatchItemProps) {
  return (
    <div
      style={{
        backgroundColor: '#1d1d1d',
        border: '1px solid #2d2d2d',
        borderRadius: '14px',
        padding: '14px',
      }}
    >
      <div
        style={{
          fontSize: '15px',
          fontWeight: 700,
          color: 'white',
          marginBottom: '6px',
        }}
      >
        {match.label}
      </div>

      <div
        style={{
          fontSize: '13px',
          color: '#9ca3af',
          marginBottom: '8px',
          wordBreak: 'break-word',
        }}
      >
        {match.path}
      </div>

      {match.textPreview && (
        <div
          style={{
            fontSize: '13px',
            color: '#d4d4d4',
            marginBottom: '8px',
          }}
        >
          {match.textPreview}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          fontSize: '12px',
          color: '#a1a1aa',
        }}
      >
        <span>Tag: {match.tag}</span>
        <span>Depth: {match.depth}</span>
      </div>
    </div>
  )
}

export default MatchItem