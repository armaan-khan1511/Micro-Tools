/**
 * File Utility service providing safe browser-native file reading,
 * formatting, download triggering, and memory-leak prevention.
 */

// Active blob URLs tracked for cleanup
const trackedBlobUrls = new Set<string>()

/**
 * Format bytes to human-readable string (e.g., 1.45 MB)
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

/**
 * Read File or Blob as ArrayBuffer
 */
export async function readFileAsArrayBuffer(file: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(new Error('Failed to read file as ArrayBuffer.'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Read File or Blob as text string
 */
export async function readFileAsText(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file as text.'))
    reader.readAsText(file)
  })
}

/**
 * Read File or Blob as Data URL (base64)
 */
export async function readFileAsDataURL(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file as Data URL.'))
    reader.readAsDataURL(file)
  })
}

/**
 * Create a managed Blob URL that is tracked for garbage collection
 */
export function createManagedBlobUrl(blob: Blob): string {
  const url = URL.createObjectURL(blob)
  trackedBlobUrls.add(url)
  return url
}

/**
 * Explicitly revoke a managed Blob URL
 */
export function revokeManagedBlobUrl(url?: string): void {
  if (url && trackedBlobUrls.has(url)) {
    URL.revokeObjectURL(url)
    trackedBlobUrls.delete(url)
  }
}

/**
 * Revoke all tracked blob URLs in memory
 */
export function revokeAllManagedBlobUrls(): void {
  trackedBlobUrls.forEach((url) => {
    try {
      URL.revokeObjectURL(url)
    } catch {
      // ignore
    }
  })
  trackedBlobUrls.clear()
}

/**
 * Trigger immediate browser download of a Blob or URL
 */
export function triggerFileDownload(urlOrBlob: string | Blob, filename: string): void {
  let downloadUrl: string
  let shouldRevoke = false

  if (typeof urlOrBlob === 'string') {
    downloadUrl = urlOrBlob
  } else {
    downloadUrl = URL.createObjectURL(urlOrBlob)
    shouldRevoke = true
  }

  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()

  setTimeout(() => {
    document.body.removeChild(link)
    if (shouldRevoke) {
      URL.revokeObjectURL(downloadUrl)
    }
  }, 1000)
}

/**
 * Check if a file matches accepted types (extensions or MIME types)
 */
export function isFileAccepted(file: File, acceptedTypes: string[]): boolean {
  if (!acceptedTypes || acceptedTypes.length === 0 || acceptedTypes.includes('*/*')) {
    return true
  }

  const fileName = file.name.toLowerCase()
  const fileType = file.type.toLowerCase()

  return acceptedTypes.some((type) => {
    const clean = type.trim().toLowerCase()
    if (clean.startsWith('.')) {
      return fileName.endsWith(clean)
    }
    if (clean.endsWith('/*')) {
      const prefix = clean.replace('/*', '')
      return fileType.startsWith(prefix)
    }
    return fileType === clean
  })
}

/**
 * Returns a human-friendly display label for a file's type.
 */
export function getFileTypeLabel(file: File): string {
  const name = file.name.toLowerCase()
  const mime = file.type.toLowerCase()

  if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'PDF Document'
  if (mime === 'image/png' || name.endsWith('.png')) return 'PNG Image'
  if (mime === 'image/jpeg' || name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'JPEG Image'
  if (mime === 'image/webp' || name.endsWith('.webp')) return 'WebP Image'
  if (mime === 'image/svg+xml' || name.endsWith('.svg')) return 'SVG Vector'
  if (mime === 'image/gif' || name.endsWith('.gif')) return 'GIF Image'
  if (mime.startsWith('image/')) return 'Image File'

  if (mime === 'audio/mpeg' || name.endsWith('.mp3')) return 'MP3 Audio'
  if (mime === 'audio/wav' || name.endsWith('.wav')) return 'WAV Audio'
  if (mime.startsWith('audio/')) return 'Audio File'

  if (mime === 'video/mp4' || name.endsWith('.mp4')) return 'MP4 Video'
  if (mime === 'video/webm' || name.endsWith('.webm')) return 'WebM Video'
  if (mime.startsWith('video/')) return 'Video File'

  if (mime === 'application/zip' || name.endsWith('.zip')) return 'ZIP Archive'
  if (name.endsWith('.md') || name.endsWith('.markdown')) return 'Markdown'
  if (mime === 'application/json' || name.endsWith('.json')) return 'JSON Document'
  if (name.endsWith('.csv')) return 'CSV Spreadsheet'
  if (mime.startsWith('text/') || name.endsWith('.txt')) return 'Text Document'

  return mime || name.split('.').pop()?.toUpperCase() || 'Binary File'
}

