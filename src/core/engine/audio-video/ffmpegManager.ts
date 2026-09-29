import type { FFmpeg } from '@ffmpeg/ffmpeg'

let ffmpegPromise: Promise<FFmpeg> | null = null
let loadedInstance: FFmpeg | null = null

export interface FFmpegProgressStatus {
  ratio?: number
  time?: number
  message?: string
}

/**
 * Checks whether the FFmpeg WebAssembly engine is already initialized.
 */
export function isFFmpegLoaded(): boolean {
  return loadedInstance !== null && loadedInstance.loaded
}

/**
 * Dynamically loads and initializes the single-threaded FFmpeg WebAssembly core.
 * Does NOT require Cross-Origin Isolation headers (COOP/COEP).
 * Loads only when a video/transcoding tool is opened by the user.
 */
export async function getFFmpeg(
  onProgress?: (progressPercentage: number, statusText: string) => void
): Promise<FFmpeg> {
  if (loadedInstance && loadedInstance.loaded) {
    return loadedInstance
  }

  if (ffmpegPromise) {
    return ffmpegPromise
  }

  ffmpegPromise = (async () => {
    onProgress?.(5, 'Loading FFmpeg WebAssembly runtime wrapper...')

    // Dynamically import @ffmpeg/ffmpeg and @ffmpeg/util to ensure zero overhead on initial bundle
    const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
      import('@ffmpeg/ffmpeg'),
      import('@ffmpeg/util'),
    ])

    const ffmpeg = new FFmpeg()

    ffmpeg.on('log', ({ message }) => {
      // Optional debug logging in development
      if (import.meta.env.DEV) {
        console.debug('[FFmpeg Core]:', message)
      }
    })

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'

    onProgress?.(15, 'Fetching single-threaded WebAssembly binary (~25MB)...')
    const coreURL = await toBlobURL(
      `${baseURL}/ffmpeg-core.js`,
      'text/javascript',
      true,
      (p) => {
        const pct = 15 + Math.round((p.received / (p.total || 25000000)) * 25)
        onProgress?.(Math.min(40, pct), `Downloading FFmpeg JS runtime (${Math.round(p.received / 1024)} KB)...`)
      }
    )

    onProgress?.(42, 'Fetching FFmpeg WASM compilation...')
    const wasmURL = await toBlobURL(
      `${baseURL}/ffmpeg-core.wasm`,
      'application/wasm',
      true,
      (p) => {
        const pct = 42 + Math.round((p.received / (p.total || 25000000)) * 45)
        onProgress?.(Math.min(88, pct), `Downloading FFmpeg WASM core (${Math.round(p.received / 1024)} KB)...`)
      }
    )

    onProgress?.(90, 'Compiling and initializing WebAssembly virtual machine...')
    await ffmpeg.load({
      coreURL,
      wasmURL,
    })

    onProgress?.(100, 'FFmpeg engine ready!')
    loadedInstance = ffmpeg
    return ffmpeg
  })().catch((err) => {
    ffmpegPromise = null
    loadedInstance = null
    throw new Error(
      `Failed to initialize FFmpeg WebAssembly: ${err.message || 'Network error loading WASM core from CDN'}. Please check internet connection.`
    )
  })

  return ffmpegPromise
}

/**
 * Safely removes files from the virtual Emscripten filesystem to free browser RAM.
 */
export async function cleanupVirtualFiles(ffmpeg: FFmpeg, filenames: string[]): Promise<void> {
  for (const name of filenames) {
    try {
      await ffmpeg.deleteFile(name)
    } catch {
      // Ignore if file doesn't exist
    }
  }
}
