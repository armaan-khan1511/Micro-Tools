/**
 * Client helper to run hash calculations off-main-thread via Web Worker,
 * with automatic fallback to native window.crypto.subtle.
 */

export interface HashProgressCallback {
  (percentage: number, stage: string): void
}

export async function calculateHashWithWorker(
  file: File,
  algorithm: 'SHA-256' | 'SHA-512' | 'SHA-1' = 'SHA-256',
  onProgress?: HashProgressCallback,
  signal?: AbortSignal
): Promise<string> {
  // Check if Web Workers are supported
  if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
    try {
      return await new Promise<string>((resolve, reject) => {
        const worker = new Worker(new URL('./hashWorker.ts', import.meta.url), {
          type: 'module',
        })

        const cleanup = () => {
          worker.terminate()
        }

        if (signal) {
          signal.addEventListener('abort', () => {
            cleanup()
            reject(new DOMException('Operation aborted by user', 'AbortError'))
          })
        }

        worker.onmessage = (e: MessageEvent) => {
          const data = e.data
          if (data.type === 'progress') {
            onProgress?.(data.percentage, data.stage)
          } else if (data.type === 'success') {
            cleanup()
            resolve(data.hash)
          } else if (data.type === 'error') {
            cleanup()
            reject(new Error(data.error))
          }
        }

        worker.onerror = (err) => {
          cleanup()
          reject(err)
        }

        worker.postMessage({ file, algorithm })
      })
    } catch {
      // Fallback to main thread if worker initialization failed
    }
  }

  // Fallback: Browser-native SubtleCrypto on main thread
  onProgress?.(30, 'Reading file buffer...')
  const buffer = await file.arrayBuffer()
  onProgress?.(70, `Calculating ${algorithm} on main thread...`)
  const hashBuffer = await crypto.subtle.digest(algorithm, buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  onProgress?.(100, 'Complete')
  return hashHex
}
