import type { ChangeEvent } from 'react'
import Input from '../../../components/ui/Input'

type TopNInputProps = {
  value: number
  onChange: (value: number) => void
}

function TopNInput({ value, onChange }: TopNInputProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const parsedValue = Number(e.target.value)
    onChange(Number.isNaN(parsedValue) ? 0 : parsedValue)
  }

  return (
    <Input
      label="Top N"
      type="number"
      value={value}
      onChange={handleChange}
      placeholder="5"
    />
  )
}

export default TopNInput