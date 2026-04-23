import type { ChangeEvent } from 'react'
import Input from '../../../components/ui/Input'

type UrlInputProps = {
  value: string
  onChange: (value: string) => void
}

function UrlInput({ value, onChange }: UrlInputProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  return (
    <Input
      label="Website URL"
      value={value}
      onChange={handleChange}
      placeholder="https://example.com"
    />
  )
}

export default UrlInput