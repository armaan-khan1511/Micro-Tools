import React, { useState, useRef, type DragEvent, type ChangeEvent } from 'react'
import { UploadCloud, File, X, AlertCircle } from 'lucide-react'

interface DropZoneProps {
  accepts?: string[]
  multiple?: boolean
  maxSizeMb?: number
  onFilesSelected: (files: File[]) => void
  selectedFiles?: File[]
  onRemoveFile?: (index: number) => void
  title?: string
  subtitle?: string
}

export const DropZone: React.FC<DropZoneProps> = ({
  accepts,
  multiple = false,
  maxSizeMb = 100,
  onFilesSelected,
  selectedFiles = [],
  onRemoveFile,
  title = 'Drag & drop your file here, or click to browse',
  subtitle,
}) => {
  const [isDragActive, setIsDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  const validateAndProcessFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    setError(null)

    const incoming: File[] = Array.from(fileList)
    const valid: File[] = []

    for (const file of incoming) {
      if (maxSizeMb && file.size > maxSizeMb * 1024 * 1024) {
        setError(`"${file.name}" exceeds the safe browser limit of ${maxSizeMb} MB.`)
        return
      }
      valid.push(file)
    }

    if (valid.length > 0) {
      onFilesSelected(valid)
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    validateAndProcessFiles(e.dataTransfer.files)
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    validateAndProcessFiles(e.target.files)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      <div
        className={`dropzone-container ${isDragActive ? 'drag-active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accepts?.join(',')}
          multiple={multiple}
          style={{ display: 'none' }}
          onChange={handleInputChange}
        />

        <div className="dropzone-icon">
          <UploadCloud size={28} />
        </div>

        <div>
          <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {title}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {subtitle || (accepts ? `Supported formats: ${accepts.join(', ')}` : 'All formats supported')}
            {maxSizeMb ? ` (Up to ${maxSizeMb} MB in browser memory)` : ''}
          </div>
        </div>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={(e) => {
            e.stopPropagation()
            inputRef.current?.click()
          }}
          style={{ marginTop: '0.5rem', pointerEvents: 'auto' }}
        >
          Browse Files
        </button>
      </div>

      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(244, 63, 94, 0.12)',
            color: 'var(--accent-rose)',
            fontSize: '0.85rem',
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Selected Files ({selectedFiles.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {selectedFiles.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.625rem 0.875rem',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
                  <File size={16} color="var(--accent-primary)" />
                  <span
                    style={{
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      maxWidth: '400px',
                      color: 'var(--text-primary)',
                      fontWeight: 500,
                    }}
                  >
                    {file.name}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    ({formatBytes(file.size)})
                  </span>
                </div>

                {onRemoveFile && (
                  <button
                    type="button"
                    onClick={() => onRemoveFile(idx)}
                    style={{ color: 'var(--text-muted)', padding: '0.25rem', borderRadius: '4px' }}
                    title="Remove file"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
