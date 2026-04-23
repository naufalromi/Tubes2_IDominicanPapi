type TabOption = {
  label: string
  value: string
}

type TabsProps = {
  options: TabOption[]
  value: string
  onChange: (value: string) => void
}

function Tabs({ options, value, onChange }: TabsProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        width: '100%',
      }}
    >
      {options.map((option) => {
        const isActive = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: '8px',
              border: isActive ? 'none' : '1px solid #333',
              backgroundColor: isActive ? '#2563eb' : '#1d1d1d',
              color: isActive ? 'white' : '#ccc',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export default Tabs