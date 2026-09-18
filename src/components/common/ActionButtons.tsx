import React, { useState } from 'react'
import { Download, RefreshCw, Copy, Check } from 'lucide-react'

interface ActionButtonsProps {
  onProcess?: () => void
  isProcessing?: boolean
  processLabel?: string
  canProcess?: boolean
  downloadUrl?: string | null
  downloadFilename?: string
  onReset?: () => void
  copyText?: string
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onProcess,
  isProcessing = false,
  processLabel = 'Process File',
  canProcess = true,
  downloadUrl,
  downloadFilename = 'processed_output',
  onReset,
  copyText,
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!copyText) return
    navigator.clipboard.writeText(copyText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
      {onProcess && !downloadUrl && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={onProcess}
          disabled={!canProcess || isProcessing}
        >
          {isProcessing ? (
            <>
              <RefreshCw size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
              Processing...
            </>
          ) : (
            processLabel
          )}
        </button>
      )}

      {downloadUrl && (
        <a
          href={downloadUrl}
          download={downloadFilename}
          className="btn btn-primary"
          style={{ backgroundColor: 'var(--accent-emerald)', borderColor: 'transparent' }}
        >
          <Download size={16} />
          Download {downloadFilename}
        </a>
      )}

      {copyText && (
        <button type="button" className="btn btn-secondary" onClick={handleCopy}>
          {copied ? <Check size={16} color="var(--accent-emerald)" /> : <Copy size={16} />}
          {copied ? 'Copied!' : 'Copy Result'}
        </button>
      )}

      {onReset && (
        <button type="button" className="btn btn-secondary" onClick={onReset} disabled={isProcessing}>
          <RefreshCw size={15} />
          Reset
        </button>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
