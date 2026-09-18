import JSZip from 'jszip'

export interface ZipEntryInfo {
  name: string
  size: number
  isDir: boolean
}

/**
 * Creates a standard compressed .zip file from multiple files with progress reporting.
 */
export async function createZip(
  files: File[],
  onProgress?: (progress: number, status: string) => void
): Promise<Blob> {
  if (files.length === 0) {
    throw new Error('Please select at least one file to create a ZIP.')
  }

  onProgress?.(10, 'Preparing files for archive...')
  const zip = new JSZip()

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    zip.file(file.name, file)
  }

  onProgress?.(30, 'Compressing archive with DEFLATE...')
  const content = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      onProgress?.(
        30 + Math.round((metadata.percent / 100) * 65),
        `Compressing: ${Math.round(metadata.percent)}%`
      )
    }
  )

  onProgress?.(100, 'ZIP archive created successfully!')
  return content
}

/**
 * Inspects the contents of a ZIP file without fully extracting everything.
 */
export async function inspectZip(zipFile: File): Promise<ZipEntryInfo[]> {
  const zip = new JSZip()
  const arrayBuffer = await zipFile.arrayBuffer()
  const loadedZip = await zip.loadAsync(arrayBuffer)

  const entries: ZipEntryInfo[] = []
  loadedZip.forEach((relativePath, zipEntry) => {
    // JSZip uses internal _data for uncompressed size or provides async
    entries.push({
      name: relativePath,
      size: (zipEntry as any)._data?.uncompressedSize || 0,
      isDir: zipEntry.dir,
    })
  })

  return entries
}

/**
 * Extracts a specific entry from a ZIP archive as a downloadable Blob.
 */
export async function extractZipEntry(zipFile: File, entryName: string): Promise<Blob> {
  const zip = new JSZip()
  const arrayBuffer = await zipFile.arrayBuffer()
  const loadedZip = await zip.loadAsync(arrayBuffer)
  const entry = loadedZip.file(entryName)

  if (!entry) {
    throw new Error(`File "${entryName}" not found in archive.`)
  }

  return await entry.async('blob')
}

/**
 * Computes a cryptographic hash using the browser's hardware-accelerated Web Crypto API.
 */
export async function calculateFileHash(
  file: File,
  algorithm: 'SHA-256' | 'SHA-512' | 'SHA-1' = 'SHA-256',
  onProgress?: (progress: number, status: string) => void
): Promise<string> {
  onProgress?.(10, `Reading ${file.name} into memory...`)
  const arrayBuffer = await file.arrayBuffer()

  onProgress?.(50, `Hashing via Web Crypto SubtleCrypto (${algorithm})...`)
  const hashBuffer = await crypto.subtle.digest(algorithm, arrayBuffer)

  onProgress?.(90, 'Formatting hexadecimal digest...')
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  onProgress?.(100, 'Hash generated!')
  return hashHex
}

/**
 * Encodes a file to Base64 Data URL string.
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (err) => reject(err)
    reader.readAsDataURL(file)
  })
}

/**
 * Converts a Base64 string to a downloadable Blob.
 */
export function base64ToBlob(base64: string): Blob {
  const parts = base64.split(';base64,')
  let contentType = ''
  let rawBase64 = base64

  if (parts.length === 2) {
    contentType = parts[0].replace('data:', '')
    rawBase64 = parts[1]
  }

  const byteCharacters = atob(rawBase64.replace(/\s/g, ''))
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: contentType || 'application/octet-stream' })
}
