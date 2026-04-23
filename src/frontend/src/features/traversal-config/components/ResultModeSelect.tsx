import type { ChangeEvent } from 'react'
import Select from '../../../components/ui/Select'
import type { ResultMode } from '../types'

type ResultModeSelectProps = {
  value: ResultMode
  onChange: (value: ResultMode) => void
}

function ResultModeSelect({ value, onChange }: ResultModeSelectProps) {
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as ResultMode)
  }

  return (
    <Select
      label="Result Mode"
      value={value}
      onChange={handleChange}
      options={[
        { label: 'All Occurrences', value: 'all' },
        { label: 'Top N Matches', value: 'topn' },
      ]}
    />
  )
}

export default ResultModeSelect