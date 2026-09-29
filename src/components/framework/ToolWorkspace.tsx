import React from 'react'
import type { UseFileProcessorReturn } from '../../hooks/useFileProcessor'
import { FileDropZone } from '../upload/FileDropZone'
import { ProcessingState } from '../processing/ProcessingState'
import { ResultDisplay } from '../results/ResultDisplay'
import { Play } from 'lucide-react'

export interface ToolWorkspaceProps {
  processor: UseFileProcessorReturn
  acceptedTypes?: string[]
  supportsMultipleFiles?: boolean
  maxSizeMb?: number
  minFiles?: number
  dropzoneTitle?: string
  actionLabel?: string
  onExecute: () => void
  options?: React.ReactNode
  originalSizeBytes?: number
  resultTitle?: string
}

export const ToolWorkspace: React.FC<ToolWorkspaceProps> = ({
  processor,
  acceptedTypes,
  supportsMultipleFiles,
  maxSizeMb,
  minFiles = 1,
  dropzoneTitle,
  actionLabel = 'Process File',
  onExecute,
  options,
  originalSizeBytes,
  resultTitle,
}) => {
  const {
    status,
    files,
    progress,
    output,
    error,
    validationError,
    isProcessing,
    setFiles,
    addFiles,
    removeFile,
    clearFiles,
    cancel,
    reset,
  } = processor

  const isCompleted = status === 'completed' && output !== null

  return (
    <div className="tool-workspace-flow" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Upload Area (Only show when not completed) */}
      {!isCompleted && (
        <FileDropZone
          acceptedTypes={acceptedTypes}
          supportsMultipleFiles={supportsMultipleFiles}
          maxSizeMb={maxSizeMb}
          minFiles={minFiles}
          title={dropzoneTitle}
          onFilesSelected={supportsMultipleFiles ? addFiles : setFiles}
          selectedFiles={files}
          onRemoveFile={removeFile}
          onClearFiles={clearFiles}
          disabled={isProcessing}
          validationError={validationError}
        />
      )}

      {/* 2. Tool Options & Primary Action Button (Show when files selected and not completed) */}
      {!isCompleted && files.length >= minFiles && !validationError && (
        <div
          className="tool-action-bar"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            padding: '1.25rem',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {/* Custom Tool Options Slot */}
          {options && <div className="tool-options-slot">{options}</div>}

          {/* Primary Process Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onExecute}
              disabled={isProcessing}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <Play size={15} fill="currentColor" />
              {isProcessing ? 'Processing in Browser...' : actionLabel}
            </button>
          </div>
        </div>
      )}

      {/* 3. Processing State (Validating, Processing, or Error) */}
      <ProcessingState
        status={status}
        progress={progress}
        error={error}
        onCancel={cancel}
        onReset={reset}
      />

      {/* 4. Result Display (When Completed) */}
      {isCompleted && output && (
        <ResultDisplay
          output={output}
          originalSizeBytes={originalSizeBytes || files.reduce((acc, f) => acc + f.size, 0)}
          title={resultTitle}
          onReset={reset}
        />
      )}
    </div>
  )
}
