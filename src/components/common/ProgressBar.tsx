import React from 'react'

interface ProgressBarProps {
  progress: number // 0 to 100
  statusText?: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, statusText }) => {
  const clamped = Math.min(100, Math.max(0, progress))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
          {statusText || 'Processing locally...'}
        </span>
        <span style={{ color: 'var(--accent-primary)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
          {Math.round(clamped)}%
        </span>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar-fill" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  )
}
