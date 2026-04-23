import type { ReactNode } from 'react'

type CardProps = {
  children: ReactNode
  padding?: string
}

function Card({ children, padding = '16px' }: CardProps) {
  return (
    <div
      style={{
        backgroundColor: '#1d1d1d',
        border: '1px solid #2d2d2d',
        borderRadius: '12px',
        padding,
        boxSizing: 'border-box',
      }}
    >
      {children}
    </div>
  )
}

export default Card