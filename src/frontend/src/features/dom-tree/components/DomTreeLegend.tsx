import type { DomTreeLegendItem } from '../types'

type DomTreeLegendProps = {
  items?: DomTreeLegendItem[]
}

function DomTreeLegend({ items }: DomTreeLegendProps) {
  const legendItems: DomTreeLegendItem[] =
    items ?? [
      { label: 'Normal Node', color: '#2d2d2d' },
      { label: 'Visited Node', color: '#2563eb' },
      { label: 'Matched Node', color: '#15803d' },
    ]

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: '18px',
      }}
    >
      {legendItems.map((item) => (
        <div
          key={item.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#d1d5db',
            fontSize: '14px',
          }}
        >
          <span
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '999px',
              backgroundColor: item.color,
              border: '2px solid rgba(255,255,255,0.12)',
              display: 'inline-block',
            }}
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export default DomTreeLegend