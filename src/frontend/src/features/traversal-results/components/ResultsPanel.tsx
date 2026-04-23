import EmptyState from '../../../components/ui/EmptyState'
import MatchList from './MatchList'
import type { MatchResult } from '../types'

type ResultsPanelProps = {
  matches?: MatchResult[]
}

function ResultsPanel({ matches = [] }: ResultsPanelProps) {
  const hasMatches = matches.length > 0

  return (
    <section
      style={{
        backgroundColor: '#111',
        color: 'white',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          gap: '12px',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 700,
            }}
          >
            Traversal Results
          </h2>
          <p
            style={{
              margin: '6px 0 0',
              fontSize: '13px',
              color: '#9ca3af',
            }}
          >
            Matching DOM elements found by the traversal
          </p>
        </div>

        <div
          style={{
            padding: '6px 10px',
            borderRadius: '999px',
            border: '1px solid #333',
            backgroundColor: '#1c1c1c',
            fontSize: '12px',
            color: '#d4d4d4',
            whiteSpace: 'nowrap',
          }}
        >
          {matches.length} match{matches.length !== 1 ? 'es' : ''}
        </div>
      </div>

      {hasMatches ? (
        <MatchList matches={matches} />
      ) : (
        <EmptyState
          title="No Matches Found"
          description="Run a traversal with a CSS selector to see matching DOM elements here."
        />
      )}
    </section>
  )
}

export default ResultsPanel