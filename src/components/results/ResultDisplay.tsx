import React, { useState } from 'react'
import { Download, Copy, Check, ArrowRight, RefreshCw, FileCheck } from 'lucide-react'
import type { ProcessOutput } from '../../types/processing'
import { formatBytes, triggerFileDownload } from '../../services/file/fileUtils'

export interface ResultDisplayProps {
  output: ProcessOutput
  originalSizeBytes?: number
  title?: string
  onReset: () => void
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({
  output,
  originalSizeBytes,
  title = 'Processing Complete',
  onReset,
}) => {
  const [copied, setCopied] = useState(false)

  const outputSizeBytes = output.sizeBytes || output.blob?.size || 0

  const handleDownload = () => {
    if (output.blob && output.downloadName) {
      triggerFileDownload(output.blob, output.downloadName)
    }
  }

  const handleCopy = () => {
    if (typeof output.data === 'string') {
      navigator.clipboard.writeText(output.data)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Calculate file size difference if available
  let sizeSavings: string | null = null
  if (originalSizeBytes && outputSizeBytes && originalSizeBytes > outputSizeBytes) {
    const diff = originalSizeBytes - outputSizeBytes
    const pct = Math.round((diff / originalSizeBytes) * 100)
    sizeSavings = `Reduced by ${formatBytes(diff)} (${pct}%)`
  }

  return (
    <div className="result-display-wrapper" style={{ marginTop: '1.5rem' }}>
      <div
        style={{
          padding: '1.5rem',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileCheck size={20} color="var(--accent-emerald, #10b981)" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {title}
              </h3>
            </div>
            {sizeSavings && (
              <span
                style={{
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  color: 'var(--accent-emerald, #10b981)',
                  display: 'inline-block',
                  marginTop: '0.25rem',
                }}
              >
                🎉 {sizeSavings}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onReset}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <RefreshCw size={14} />
              Reset
            </button>

            {typeof output.data === 'string' && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCopy}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleDownload}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Download size={14} />
              Download {output.downloadName}
            </button>
          </div>
        </div>

        {/* Output File Specifications */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem',
            padding: '0.85rem 1rem',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.85rem',
          }}
        >
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Output File: </span>
            <strong style={{ color: 'var(--text-primary)' }}>{output.downloadName}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Type: </span>
            <strong style={{ color: 'var(--text-primary)' }}>{output.mimeType || 'Application File'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Size: </span>
            <strong style={{ color: 'var(--text-primary)' }}>{formatBytes(outputSizeBytes)}</strong>
          </div>
        </div>

        {/* Size Comparison Bar if original was provided */}
        {originalSizeBytes !== undefined && outputSizeBytes > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.825rem',
              color: 'var(--text-secondary)',
            }}
          >
            <span>Original: <strong>{formatBytes(originalSizeBytes)}</strong></span>
            <ArrowRight size={14} />
            <span>Output: <strong>{formatBytes(outputSizeBytes)}</strong></span>
          </div>
        )}

        {/* Image Preview */}
        {output.previewUrl && (
          <div
            style={{
              textAlign: 'center',
              padding: '0.75rem',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <img
              src={output.previewUrl}
              alt="Processed preview"
              style={{
                maxWidth: '100%',
                maxHeight: '320px',
                borderRadius: 'var(--radius-sm)',
                objectFit: 'contain',
              }}
            />
          </div>
        )}

        {/* Text Output Preview */}
        {typeof output.data === 'string' && (
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              padding: '1rem',
              maxHeight: '260px',
              overflowY: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {output.data}
          </div>
        )}
      </div>
    </div>
  )
}
