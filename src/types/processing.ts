export type ProcessingStatus =
  | 'idle'
  | 'file_selected'
  | 'validating'
  | 'processing'
  | 'completed'
  | 'error'
  // Backward compatibility alias
  | 'success'
  | 'cancelled'

export interface ProcessProgress {
  percentage?: number | null // null or undefined indicates indeterminate progress
  isIndeterminate?: boolean  // true if progress cannot be measured exactly (honest progress)
  stage: string              // User-facing description of current activity
  bytesProcessed?: number
  totalBytes?: number
}

export interface ProcessOutput<T = unknown> {
  data?: T
  blob: Blob                   // Real Blob or File instance
  downloadName: string         // Output filename
  mimeType: string             // Output MIME type
  sizeBytes: number            // Output size in bytes
  downloadUrl?: string         // Optional object URL
  previewUrl?: string          // Managed object URL for preview
  metadata?: Record<string, unknown>
  logs?: string[]
}

export interface ProcessError {
  code?: string
  message: string
  details?: unknown
}

export interface ValidationResult {
  valid: boolean
  error?: string
}

export interface FileValidationConfig {
  acceptedTypes?: string[]
  maxSizeMb?: number
  supportsMultipleFiles?: boolean
  minFiles?: number
  maxFiles?: number
}

export interface ToolProcessor<TInput = unknown, TOptions = unknown, TOutput = unknown> {
  validate?: (input: TInput, options?: TOptions) => ValidationResult
  process: (
    input: TInput,
    options: TOptions,
    onProgress: (progress: ProcessProgress) => void,
    signal?: AbortSignal
  ) => Promise<ProcessOutput<TOutput>>
  cleanup?: (output: ProcessOutput<TOutput>) => void
}
