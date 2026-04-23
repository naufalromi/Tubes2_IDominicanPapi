import type { ChangeEvent } from 'react'

type HtmlInputProps = {
  value: string
  onChange: (value: string) => void
}

function HtmlInput({ value, onChange }: HtmlInputProps) {
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  return (
    <div style={{ width: '100%' }}>
      <label
        style={{
          display: 'block',
          marginBottom: '8px',
          fontSize: '14px',
          color: '#ccc',
        }}
      >
        HTML Input
      </label>

      <textarea
        value={value}
        onChange={handleChange}
        placeholder="Paste HTML content"
        rows={8}
        style={{
          width: '100%',
          padding: '14px 16px',
          backgroundColor: '#101010',
          color: 'white',
          border: '1px solid #333',
          borderRadius: '12px',
          boxSizing: 'border-box',
          outline: 'none',
          fontSize: '15px',
          resize: 'vertical',
          minHeight: '180px',
        }}
      />
    </div>
  )
}

export default HtmlInput