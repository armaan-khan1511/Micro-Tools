import { useState, useRef, useEffect, useCallback } from 'react'
import type {
  ProcessingStatus,
  ProcessProgress,
  ProcessOutput,
  ToolProcessor,
  FileValidationConfig,
} from '../types/processing'
import { validateFiles, formatFriendlyError } from '../services/file/fileValidation'
import { revokeManagedBlobUrl } from '../services/file/fileUtils'

export interface UseFileProcessorOptions extends FileValidationConfig {
  initialFiles?: File[]
}

export interface UseFileProcessorReturn<TOptions = unknown, TOutput = unknown> {
  status: ProcessingStatus
  files: File[]
  progress: ProcessProgress
  output: ProcessOutput<TOutput> | null
  error: string | null
  validationError: string | null
  isProcessing: boolean
  setFiles: (files: File[]) => boolean
  addFiles: (files: File[]) => boolean
  removeFile: (index: number) => void
  clearFiles: () => void
  startProcessing: (
    options: TOptions,
    processor: ToolProcessor<File[], TOptions, TOutput>
  ) => Promise<ProcessOutput<TOutput> | undefined>
  cancel: () => void
  reset: () => void
}

export function useFileProcessor<TOptions = unknown, TOutput = unknown>(
  config: UseFileProcessorOptions = {}
): UseFileProcessorReturn<TOptions, TOutput> {
  const [status, setStatus] = useState<ProcessingStatus>('idle')
  const [files, setFilesState] = useState<File[]>(config.initialFiles || [])
  const [progress, setProgress] = useState<ProcessProgress>({
    percentage: null,
    isIndeterminate: false,
    stage: '',
  })
  const [output, setOutput] = useState<ProcessOutput<TOutput> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const activeProcessorRef = useRef<ToolProcessor<File[], TOptions, TOutput> | null>(null)
  const activeOutputRef = useRef<ProcessOutput<TOutput> | null>(null)

  useEffect(() => {
    activeOutputRef.current = output
  }, [output])

  // Resource cleanup helper
  const cleanupOutput = useCallback((targetOutput: ProcessOutput<TOutput> | null) => {
    if (!targetOutput) return

    if (targetOutput.previewUrl) {
      revokeManagedBlobUrl(targetOutput.previewUrl)
    }

    if (activeProcessorRef.current?.cleanup) {
      try {
        activeProcessorRef.current.cleanup(targetOutput)
      } catch {
        // safe ignore
      }
    }
  }, [])

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      cleanupOutput(activeOutputRef.current)
    }
  }, [cleanupOutput])

  // Reset entire state and cleanup resources
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    cleanupOutput(activeOutputRef.current)
    setOutput(null)
    setError(null)
    setValidationError(null)
    setFilesState([])
    setStatus('idle')
    setProgress({ percentage: null, isIndeterminate: false, stage: '' })
  }, [cleanupOutput])

  // Clear selected files without wiping completed output unless user wants to
  const clearFiles = useCallback(() => {
    setFilesState([])
    setValidationError(null)
    if (status !== 'completed') {
      setStatus('idle')
    }
  }, [status])

  // Validate incoming files and update state
  const handleValidateAndSet = useCallback(
    (targetFiles: File[]): boolean => {
      setError(null)
      setValidationError(null)

      if (targetFiles.length === 0) {
        setFilesState([])
        setStatus('idle')
        return false
      }

      const val = validateFiles(targetFiles, config)
      if (!val.valid) {
        setValidationError(val.error || 'Invalid file selection.')
        setStatus('error')
        return false
      }

      setFilesState(targetFiles)
      setStatus('file_selected')
      return true
    },
    [config]
  )

  const setFiles = useCallback(
    (newFiles: File[]): boolean => {
      return handleValidateAndSet(newFiles)
    },
    [handleValidateAndSet]
  )

  const addFiles = useCallback(
    (incoming: File[]): boolean => {
      const combined = config.supportsMultipleFiles ? [...files, ...incoming] : incoming
      return handleValidateAndSet(combined)
    },
    [files, config.supportsMultipleFiles, handleValidateAndSet]
  )

  const removeFile = useCallback(
    (index: number) => {
      const remaining = files.filter((_, i) => i !== index)
      if (remaining.length === 0) {
        clearFiles()
      } else {
        handleValidateAndSet(remaining)
      }
    },
    [files, clearFiles, handleValidateAndSet]
  )

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setStatus(files.length > 0 ? 'file_selected' : 'idle')
    setProgress({ percentage: null, isIndeterminate: false, stage: 'Operation cancelled.' })
  }, [files.length])

  // Primary execution handler
  const startProcessing = useCallback(
    async (
      options: TOptions,
      processor: ToolProcessor<File[], TOptions, TOutput>
    ): Promise<ProcessOutput<TOutput> | undefined> => {
      if (files.length === 0) {
        setValidationError('Please select a file first.')
        setStatus('error')
        return undefined
      }

      // Cleanup any prior output
      cleanupOutput(activeOutputRef.current)
      setOutput(null)
      setError(null)
      setValidationError(null)
      activeProcessorRef.current = processor

      // 1. Validating state
      setStatus('validating')
      setProgress({ percentage: null, isIndeterminate: true, stage: 'Validating input files...' })

      // Custom tool validator if provided
      if (processor.validate) {
        const toolValidation = processor.validate(files, options)
        if (!toolValidation.valid) {
          const err = toolValidation.error || 'Input validation failed.'
          setValidationError(err)
          setStatus('error')
          return undefined
        }
      }

      // 2. Processing state
      setStatus('processing')
      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        const result = await processor.process(
          files,
          options,
          (prog) => {
            setProgress(prog)
          },
          controller.signal
        )

        setOutput(result)
        setStatus('completed')
        setProgress({ percentage: 100, isIndeterminate: false, stage: 'Completed successfully.' })
        return result
      } catch (err: unknown) {
        if (controller.signal.aborted) {
          setStatus('file_selected')
          setProgress({ percentage: null, isIndeterminate: false, stage: 'Operation cancelled.' })
          return undefined
        }

        const friendly = formatFriendlyError(err)
        setError(friendly)
        setStatus('error')
        setProgress({ percentage: null, isIndeterminate: false, stage: friendly })
        return undefined
      } finally {
        abortControllerRef.current = null
      }
    },
    [files, cleanupOutput]
  )

  return {
    status,
    files,
    progress,
    output,
    error,
    validationError,
    isProcessing: status === 'validating' || status === 'processing',
    setFiles,
    addFiles,
    removeFile,
    clearFiles,
    startProcessing,
    cancel,
    reset,
  }
}
