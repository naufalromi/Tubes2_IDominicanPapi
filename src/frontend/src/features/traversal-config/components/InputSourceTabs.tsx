import type { InputSource } from '../types'

type InputSourceTabsProps = {
  value: InputSource
  onChange: (value: InputSource) => void
}

function InputSourceTabs({ value, onChange }: InputSourceTabsProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        width: '100%',
      }}
    >
      <button
        type="button"
        onClick={() => onChange('url')}
        style={{
          flex: 1,
          padding: '14px 12px',
          backgroundColor: value === 'url' ? '#2563eb' : '#222',
          color: value === 'url' ? 'white' : '#ddd',
          border: value === 'url' ? 'none' : '1px solid #333',
          borderRadius: '12px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 500,
        }}
      >
        URL
      </button>

      <button
        type="button"
        onClick={() => onChange('html')}
        style={{
          flex: 1,
          padding: '14px 12px',
          backgroundColor: value === 'html' ? '#2563eb' : '#222',
          color: value === 'html' ? 'white' : '#ddd',
          border: value === 'html' ? 'none' : '1px solid #333',
          borderRadius: '12px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 500,
        }}
      >
        HTML
      </button>
    </div>
  )
}

export default InputSourceTabs