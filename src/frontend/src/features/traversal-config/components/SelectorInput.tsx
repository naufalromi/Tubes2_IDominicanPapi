import type { ChangeEvent } from 'react'
import Input from '../../../components/ui/Input'

type SelectorInputProps = {
  value: string
  onChange: (value: string) => void
}

function SelectorInput({ value, onChange }: SelectorInputProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  return (
    <Input
      label="CSS Selector"
      value={value}
      onChange={handleChange}
      placeholder=".class-name, #id, div > p"
    />
  )
}

export default SelectorInput