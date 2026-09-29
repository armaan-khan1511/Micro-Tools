import React from 'react'

export interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'warning'
  size?: 'sm' | 'md'
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'secondary',
  size = 'sm',
  className = '',
}) => {
  const getStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          background: 'var(--accent-primary)',
          color: '#ffffff',
          border: 'none',
        }
      case 'accent':
        return {
          background: 'rgba(59, 130, 246, 0.12)',
          color: 'var(--accent-primary)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
        }
      case 'warning':
        return {
          background: 'rgba(245, 158, 11, 0.12)',
          color: '#d97706',
          border: '1px solid rgba(245, 158, 11, 0.25)',
        }
      case 'outline':
        return {
          background: 'transparent',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-subtle)',
        }
      case 'secondary':
      default:
        return {
          background: 'var(--bg-tertiary)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-subtle)',
        }
    }
  }

  return (
    <span
      className={`ui-badge ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: size === 'sm' ? '0.2rem 0.55rem' : '0.3rem 0.75rem',
        borderRadius: 'var(--radius-full, 9999px)',
        fontSize: size === 'sm' ? '0.725rem' : '0.825rem',
        fontWeight: 600,
        letterSpacing: '0.01em',
        lineHeight: 1,
        ...getStyles(),
      }}
    >
      {children}
    </span>
  )
}
