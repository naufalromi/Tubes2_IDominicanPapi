import { useEffect, useState, type ChangeEvent } from 'react'
import Input from '../../../components/ui/Input'

type TopNInputProps = {
  value: number
  onChange: (value: number) => void
}

function TopNInput({ value, onChange }: TopNInputProps) {
  const [displayValue, setDisplayValue] = useState(String(value))

  useEffect(() => {
    setDisplayValue(String(value))
  }, [value])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value
    setDisplayValue(nextValue)

    if (nextValue.trim() === '') {
      return
    }

    const parsedValue = Number(nextValue)

    if (!Number.isNaN(parsedValue)) {
      onChange(parsedValue)
    }
  }

  return (
    <Input
      label="Top N"
      type="number"
      value={displayValue}
      onChange={handleChange}
      placeholder="5"
    />
  )
}

export default TopNInput