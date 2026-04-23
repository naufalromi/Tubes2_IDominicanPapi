import type { ChangeEvent } from 'react'

type InputProps = {
  value?: string | number
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  type?: string
  label?: string
  disabled?: boolean
}

function Input({
  value,
  onChange,
  placeholder = '',
  type = 'text',
  label,
  disabled = false,
}: InputProps) {
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

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
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
      />
    </div>
  )
}

export default Input