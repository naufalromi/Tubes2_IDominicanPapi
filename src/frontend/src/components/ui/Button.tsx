import type { ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

type ButtonProps = {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  fullWidth?: boolean
  variant?: ButtonVariant
}

function Button({
  children,
  onClick,
  type = 'button',
  disabled = false,
  fullWidth = false,
  variant = 'primary',
}: ButtonProps) {
  const getBackground = () => {
    if (disabled) return '#2a2a2a'
    if (variant === 'primary') return '#2563eb'
    if (variant === 'secondary') return '#1d1d1d'
    return 'transparent'
  }

  const getColor = () => {
    if (disabled) return '#777'
    if (variant === 'primary') return '#fff'
    if (variant === 'secondary') return '#ddd'
    return '#ccc'
  }

  const getBorder = () => {
    if (variant === 'ghost') return '1px solid #333'
    if (variant === 'secondary') return '1px solid #333'
    return 'none'
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: fullWidth ? '100%' : 'auto',
        padding: '12px 16px',
        backgroundColor: getBackground(),
        color: getColor(),
        border: getBorder(),
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: '0.2s ease',
      }}
    >
      {children}
    </button>
  )
}

export default Button