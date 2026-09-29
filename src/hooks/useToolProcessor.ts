import { useState, useRef, useEffect, useCallback } from 'react'
import type {
  ProcessingStatus,
  ProcessProgress,
  ProcessOutput,
  ToolProcessor,
} from '../types/processing'
import { revokeManagedBlobUrl } from '../services/file/fileUtils'

export interface UseToolProcessorReturn<TInput, TOptions, TOutput> {
  status: ProcessingStatus
  progress: ProcessProgress
  output: ProcessOutput<TOutput> | null
  error: string | null
  execute: (
    input: TInput,
    options: TOptions,
    processor: ToolProcessor<TInput, TOptions, TOutput>
  ) => Promise<ProcessOutput<TOutput> | undefined>
  cancel: () => void
  reset: () => void
  isProcessing: boolean
}

export function useToolProcessor<TInput = unknown, TOptions = unknown, TOutput = unknown>(): UseToolProcessorReturn<
  TInput,
  TOptions,
  TOutput
> {
  const [status, setStatus] = useState<ProcessingStatus>('idle')
  const [progress, setProgress] = useState<ProcessProgress>({ percentage: 0, stage: '' })
  const [output, setOutput] = useState<ProcessOutput<TOutput> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const activeProcessorRef = useRef<ToolProcessor<TInput, TOptions, TOutput> | null>(null)
  const activeOutputRef = useRef<ProcessOutput<TOutput> | null>(null)

  // Keep output ref updated for cleanup on unmount
  useEffect(() => {
    activeOutputRef.current = output
  }, [output])

  // Cleanup helper
  const cleanupResources = useCallback((targetOutput: ProcessOutput<TOutput> | null) => {
    if (!targetOutput) return

    if (targetOutput.downloadUrl) {
      revokeManagedBlobUrl(targetOutput.downloadUrl)
    }
    if (targetOutput.previewUrl) {
      revokeManagedBlobUrl(targetOutput.previewUrl)
    }
    if (activeProcessorRef.current?.cleanup) {
      try {
        activeProcessorRef.current.cleanup(targetOutput)
      } catch {
        // Safe ignore
      }
    }
  }, [])

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      cleanupResources(activeOutputRef.current)
    }
  }, [cleanupResources])

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setStatus('cancelled')
    setProgress({ percentage: 0, stage: 'Processing cancelled by user.' })
  }, [])

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    cleanupResources(activeOutputRef.current)
    setOutput(null)
    setError(null)
    setStatus('idle')
    setProgress({ percentage: 0, stage: '' })
  }, [cleanupResources])

  const execute = useCallback(
    async (
      input: TInput,
      options: TOptions,
      processor: ToolProcessor<TInput, TOptions, TOutput>
    ): Promise<ProcessOutput<TOutput> | undefined> => {
      // Clear previous outputs
      reset()
      activeProcessorRef.current = processor

      // 1. Validation phase
      setStatus('validating')
      setProgress({ percentage: 0, stage: 'Validating input...' })

      if (processor.validate) {
        const validation = processor.validate(input, options)
        if (!validation.valid) {
          setStatus('error')
          const errMessage = validation.error || 'Input validation failed.'
          setError(errMessage)
          setProgress({ percentage: 0, stage: errMessage })
          return undefined
        }
      }

      // 2. Processing phase
      setStatus('processing')
      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        const result = await processor.process(
          input,
          options,
          (prog) => {
            setProgress(prog)
          },
          controller.signal
        )

        setOutput(result)
        setStatus('success')
        setProgress({ percentage: 100, stage: 'Completed successfully.' })
        return result
      } catch (err: unknown) {
        if (controller.signal.aborted) {
          setStatus('cancelled')
          setProgress({ percentage: 0, stage: 'Operation cancelled.' })
          return undefined
        }

        const msg = err instanceof Error ? err.message : 'An unexpected error occurred during processing.'
        setError(msg)
        setStatus('error')
        setProgress({ percentage: 0, stage: msg })
        return undefined
      } finally {
        abortControllerRef.current = null
      }
    },
    [reset]
  )

  return {
    status,
    progress,
    output,
    error,
    execute,
    cancel,
    reset,
    isProcessing: status === 'processing' || status === 'validating',
  }
}
