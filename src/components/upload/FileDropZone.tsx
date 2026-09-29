import React, { useState, useRef, type DragEvent, type ChangeEvent } from 'react'
import { UploadCloud, File as FileIcon, X, AlertCircle, Trash2 } from 'lucide-react'
import { formatBytes, getFileTypeLabel } from '../../services/file/fileUtils'
import { validateFiles } from '../../services/file/fileValidation'
import type { FileValidationConfig } from '../../types/processing'

export interface FileDropZoneProps extends FileValidationConfig {
  accepts?: string[] // backward compatibility
  multiple?: boolean // backward compatibility
  onFilesSelected: (files: File[]) => void
  selectedFiles?: File[]
  onRemoveFile?: (index: number) => void
  onClearFiles?: () => void
  title?: string
  subtitle?: string
  disabled?: boolean
  validationError?: string | null
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({
  acceptedTypes,
  accepts,
  supportsMultipleFiles,
  multiple,
  maxSizeMb = 100,
  minFiles: _minFiles = 1,
  maxFiles,
  onFilesSelected,
  selectedFiles = [],
  onRemoveFile,
  onClearFiles,
  title,
  subtitle,
  disabled = false,
  validationError: externalError,
}) => {
  const [isDragActive, setIsDragActive] = useState(false)
  const [internalError, setInternalError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const effectiveTypes = acceptedTypes || accepts || []
  const isMultiple = supportsMultipleFiles ?? multiple ?? false

  const activeError = externalError || internalError

  const validateAndProcess = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || disabled) return
    setInternalError(null)

    const incoming: File[] = Array.from(fileList)

    const val = validateFiles(incoming, {
      acceptedTypes: effectiveTypes,
      maxSizeMb,
      supportsMultipleFiles: isMultiple,
      minFiles: 1,
      maxFiles,
    })

    if (!val.valid) {
      setInternalError(val.error || 'Invalid file selection.')
      return
    }

    onFilesSelected(incoming)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragActive(true)
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
    if (!disabled) {
      validateAndProcess(e.dataTransfer.files)
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    validateAndProcess(e.target.files)
    if (inputRef.current) inputRef.current.value = ''
  }

  const totalBytes = selectedFiles.reduce((acc, f) => acc + f.size, 0)

  return (
    <div className="dropzone-wrapper">
      {/* Drop Zone Box */}
      <div
        className={`dropzone-container ${isDragActive ? 'drag-active' : ''} ${disabled ? 'disabled' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        aria-label="Upload files drop area"
      >
        <input
          ref={inputRef}
          type="file"
          multiple={isMultiple}
          accept={effectiveTypes.length > 0 ? effectiveTypes.join(',') : undefined}
          onChange={handleInputChange}
          style={{ display: 'none' }}
          disabled={disabled}
        />

        <div className="dropzone-icon">
          <UploadCloud size={40} strokeWidth={1.75} />
        </div>

        <p className="dropzone-title">
          {title || (isMultiple ? 'Drag & drop files here, or click to browse' : 'Drag & drop your file here, or click to browse')}
        </p>

        <p className="dropzone-subtitle">
          {subtitle ||
            (effectiveTypes.length > 0
              ? `Supported formats: ${effectiveTypes.join(', ')} (up to ${maxSizeMb} MB)`
              : `Any file format up to ${maxSizeMb} MB`)}
        </p>
      </div>

      {/* Validation Error Banner */}
      {activeError && (
        <div className="dropzone-error" role="alert">
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{activeError}</span>
        </div>
      )}

      {/* Selected Files Detail List */}
      {selectedFiles.length > 0 && (
        <div className="file-list-container">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.65rem',
            }}
          >
            <h4 className="file-list-heading" style={{ margin: 0 }}>
              Selected {selectedFiles.length === 1 ? 'File' : 'Files'} ({selectedFiles.length})
              <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '0.4rem' }}>
                — {formatBytes(totalBytes)} total
              </span>
            </h4>

            {onClearFiles && !disabled && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={onClearFiles}
                style={{ fontSize: '0.785rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <Trash2 size={13} />
                Clear all
              </button>
            )}
          </div>

          <ul className="file-list">
            {selectedFiles.map((file, idx) => (
              <li key={`${file.name}-${idx}`} className="file-item">
                <div className="file-item-info">
                  <FileIcon size={18} className="file-icon" color="var(--accent-primary)" />
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span className="file-name" title={file.name}>
                      {file.name}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {getFileTypeLabel(file)} • {formatBytes(file.size)}
                    </span>
                  </div>
                </div>

                {onRemoveFile && !disabled && (
                  <button
                    type="button"
                    className="file-remove-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemoveFile(idx)
                    }}
                    aria-label={`Remove ${file.name}`}
                    title="Remove file"
                  >
                    <X size={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
