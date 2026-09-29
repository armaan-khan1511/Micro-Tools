/**
 * Web Worker for cryptographic file hash calculation off the main UI thread.
 */

self.onmessage = async (
  e: MessageEvent<{ file: File; algorithm: 'SHA-256' | 'SHA-512' | 'SHA-1' }>
) => {
  const { file, algorithm } = e.data

  try {
    self.postMessage({ type: 'progress', percentage: 20, stage: 'Reading file into memory...' })
    const arrayBuffer = await file.arrayBuffer()

    self.postMessage({ type: 'progress', percentage: 60, stage: `Calculating ${algorithm} checksum...` })
    const hashBuffer = await self.crypto.subtle.digest(algorithm, arrayBuffer)

    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

    self.postMessage({ type: 'progress', percentage: 100, stage: 'Complete' })
    self.postMessage({ type: 'success', hash: hashHex, algorithm })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Cryptographic hash calculation failed'
    self.postMessage({ type: 'error', error: message })
  }
}

export {}
