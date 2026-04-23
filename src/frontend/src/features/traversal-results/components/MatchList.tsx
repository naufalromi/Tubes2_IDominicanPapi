import MatchItem from './MatchItem'
import type { MatchResult } from '../types'

type MatchListProps = {
  matches: MatchResult[]
}

function MatchList({ matches }: MatchListProps) {
  return (
    <div
      style={{
        display: 'grid',
        gap: '12px',
      }}
    >
      {matches.map((match) => (
        <MatchItem key={match.id} match={match} />
      ))}
    </div>
  )
}

export default MatchList