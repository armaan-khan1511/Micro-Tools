import React from 'react'
import { Loader2, XCircle, AlertTriangle, RefreshCw } from 'lucide-react'
import type { ProcessingStatus, ProcessProgress } from '../../types/processing'
import { ProgressBar } from './ProgressBar'

export interface ProcessingStateProps {
  status: ProcessingStatus
  progress: ProcessProgress
  error?: string | null
  onCancel?: () => void
  onReset?: () => void
}

export const ProcessingState: React.FC<ProcessingStateProps> = ({
  status,
  progress,
  error,
  onCancel,
  onReset,
}) => {
  // Only render during validating, processing, or error states
  if (status !== 'validating' && status !== 'processing' && status !== 'error') {
    return null
  }

  const isIndeterminate =
    progress.isIndeterminate ||
    progress.percentage === null ||
    progress.percentage === undefined

  return (
    <div className="processing-state-wrapper" style={{ marginTop: '1.25rem' }}>
      {(status === 'processing' || status === 'validating') && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            padding: '1.25rem',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Loader2 className="spin" size={18} color="var(--accent-primary)" />
              <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                {status === 'validating' ? 'Validating Files' : 'Processing in Browser'}
              </span>
            </div>

            {onCancel && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onCancel}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <XCircle size={14} />
                Cancel
              </button>
            )}
          </div>

          {/* Honest Progress: Indeterminate Bar or Exact Percentage */}
          {isIndeterminate ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {progress.stage || 'Working locally...'}
              </span>
              <div
                style={{
                  height: '6px',
                  width: '100%',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div className="indeterminate-progress-bar" />
              </div>
            </div>
          ) : (
            <ProgressBar
              progress={progress.percentage as number}
              statusText={progress.stage}
            />
          )}
        </div>
      )}

      {status === 'error' && (
        <div
          role="alert"
          style={{
            padding: '1.25rem',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
            <AlertTriangle
              size={20}
              color="var(--accent-rose, #ef4444)"
              style={{ flexShrink: 0, marginTop: '2px' }}
            />
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-rose, #ef4444)' }}>
                Processing Error
              </h4>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {error || progress.stage || 'An unexpected error occurred during execution.'}
              </p>
            </div>
          </div>

          {onReset && (
            <div style={{ alignSelf: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onReset}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <RefreshCw size={13} />
                Try Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
