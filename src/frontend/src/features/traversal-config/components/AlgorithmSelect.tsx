import type { ChangeEvent } from 'react'
import Select from '../../../components/ui/Select'
import type { TraversalAlgorithm } from '../types'

type AlgorithmSelectProps = {
  value: TraversalAlgorithm
  onChange: (value: TraversalAlgorithm) => void
}

function AlgorithmSelect({ value, onChange }: AlgorithmSelectProps) {
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as TraversalAlgorithm)
  }

  return (
    <Select
      label="Traversal Algorithm"
      value={value}
      onChange={handleChange}
      options={[
        { label: 'BFS', value: 'bfs' },
        { label: 'DFS', value: 'dfs' },
      ]}
    />
  )
}

export default AlgorithmSelect