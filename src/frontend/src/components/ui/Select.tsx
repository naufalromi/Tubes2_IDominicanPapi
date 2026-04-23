import type { ChangeEvent } from 'react'

type SelectOption = {
  label: string
  value: string
}

type SelectProps = {
  value?: string
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void
  options: SelectOption[]
  label?: string
  disabled?: boolean
}

function Select({
  value,
  onChange,
  options,
  label,
  disabled = false,
}: SelectProps) {
  return (
    <div style={{ width: '100%' }}>
      {label && (
        <label
          style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            color: '#ccc',
          }}
        >
          {label}
        </label>
      )}

      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '14px 16px',
          backgroundColor: disabled ? '#1a1a1a' : '#101010',
          color: 'white',
          border: '1px solid #333',
          borderRadius: '12px',
          boxSizing: 'border-box',
          outline: 'none',
          fontSize: '15px',
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default Select