import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'blue' | 'green' | 'gray'

type BadgeProps = {
  children: ReactNode
  variant?: BadgeVariant
}

function Badge({ children, variant = 'default' }: BadgeProps) {
  const getBackground = () => {
    if (variant === 'blue') return '#1d4ed8'
    if (variant === 'green') return '#166534'
    if (variant === 'gray') return '#2a2a2a'
    return '#1f1f1f'
  }

  const getBorder = () => {
    if (variant === 'blue') return '1px solid #2563eb'
    if (variant === 'green') return '1px solid #22c55e'
    return '1px solid #333'
  }

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '6px 10px',
        borderRadius: '999px',
        backgroundColor: getBackground(),
        border: getBorder(),
        color: '#ddd',
        fontSize: '12px',
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  )
}

export default Badge