/**
 * Loads an image File or Blob into an HTMLImageElement
 */
export function loadImage(fileOrBlob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(fileOrBlob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to decode image file.'))
    }
    img.src = url
  })
}

/**
 * Compresses an image with adjustable quality (0.1 to 1.0) and optional dimension scaling.
 */
export async function compressImage(
  file: File,
  quality: number = 0.8,
  maxWidth?: number,
  outputFormat: 'image/jpeg' | 'image/webp' = 'image/jpeg'
): Promise<{ blob: Blob; originalSize: number; compressedSize: number; savingsPercent: number }> {
  const img = await loadImage(file)
  let width = img.width
  let height = img.height

  if (maxWidth && width > maxWidth) {
    height = Math.round((height * maxWidth) / width)
    width = maxWidth
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context.')

  // If JPEG, fill white background for transparency
  if (outputFormat === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
  }

  ctx.drawImage(img, 0, 0, width, height)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, outputFormat, quality))
  if (!blob) throw new Error('Image compression failed.')

  const originalSize = file.size
  const compressedSize = blob.size
  const savingsPercent = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))

  return { blob, originalSize, compressedSize, savingsPercent }
}

/**
 * Converts an image between formats (PNG, JPEG, WebP)
 */
export async function convertImageFormat(
  file: File,
  targetFormat: 'image/png' | 'image/jpeg' | 'image/webp'
): Promise<Blob> {
  const img = await loadImage(file)
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context.')

  if (targetFormat === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, img.width, img.height)
  }

  ctx.drawImage(img, 0, 0)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, targetFormat, 0.92))
  if (!blob) throw new Error('Format conversion failed.')
  return blob
}

/**
 * Resizes an image by explicit dimensions.
 */
export async function resizeImage(
  file: File,
  targetWidth: number,
  targetHeight: number,
  format: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/png'
): Promise<Blob> {
  const img = await loadImage(file)
  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context.')

  if (format === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, targetWidth, targetHeight)
  }

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, format, 0.95))
  if (!blob) throw new Error('Resize failed.')
  return blob
}

/**
 * Crops a sub-region from an image.
 */
export async function cropImage(
  file: File,
  cropRect: { x: number; y: number; width: number; height: number },
  format: 'image/png' | 'image/jpeg' = 'image/png'
): Promise<Blob> {
  const img = await loadImage(file)
  const canvas = document.createElement('canvas')
  canvas.width = cropRect.width
  canvas.height = cropRect.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context.')

  ctx.drawImage(
    img,
    cropRect.x,
    cropRect.y,
    cropRect.width,
    cropRect.height,
    0,
    0,
    cropRect.width,
    cropRect.height
  )

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, format, 0.95))
  if (!blob) throw new Error('Cropping failed.')
  return blob
}

/**
 * Extracts dominant color palette from image pixels.
 */
export async function extractColorPalette(file: File, colorCount: number = 6): Promise<string[]> {
  const img = await loadImage(file)
  const canvas = document.createElement('canvas')
  // Scale down for fast sampling
  const sampleSize = 100
  canvas.width = sampleSize
  canvas.height = sampleSize
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context.')

  ctx.drawImage(img, 0, 0, sampleSize, sampleSize)
  const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize).data

  // Simple color quantization bucket
  const colorBuckets: Record<string, { r: number; g: number; b: number; count: number }> = {}

  for (let i = 0; i < imgData.length; i += 4) {
    const a = imgData[i + 3]
    if (a < 128) continue // Ignore transparent pixels

    // Quantize to step of 32 to group similar colors
    const step = 32
    const qr = Math.floor(imgData[i] / step) * step
    const qg = Math.floor(imgData[i + 1] / step) * step
    const qb = Math.floor(imgData[i + 2] / step) * step
    const key = `${qr},${qg},${qb}`

    if (!colorBuckets[key]) {
      colorBuckets[key] = { r: imgData[i], g: imgData[i + 1], b: imgData[i + 2], count: 0 }
    }
    colorBuckets[key].count++
  }

  const sorted = Object.values(colorBuckets).sort((a, b) => b.count - a.count)
  const topColors = sorted.slice(0, colorCount)

  return topColors.map((c) => {
    const toHex = (n: number) => n.toString(16).padStart(2, '0')
    return `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`
  })
}

/**
 * Strips EXIF metadata by re-encoding raw pixel buffers.
 */
export async function stripExifMetadata(file: File): Promise<Blob> {
  const img = await loadImage(file)
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context.')

  ctx.drawImage(img, 0, 0)
  const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, 0.95))
  if (!blob) throw new Error('EXIF strip failed.')
  return blob
}

/**
 * Overlays text (watermark/meme) onto an image.
 */
export async function overlayWatermark(
  file: File,
  options: {
    topText?: string
    bottomText?: string
    fontSize?: number
    textColor?: string
    opacity?: number
  }
): Promise<Blob> {
  const img = await loadImage(file)
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context.')

  ctx.drawImage(img, 0, 0)

  const fontSize = options.fontSize || Math.max(20, Math.round(canvas.width / 18))
  ctx.font = `bold ${fontSize}px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillStyle = options.textColor || '#ffffff'
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = Math.max(2, Math.round(fontSize / 8))
  ctx.globalAlpha = options.opacity !== undefined ? options.opacity : 0.9

  if (options.topText) {
    const y = fontSize + 20
    ctx.strokeText(options.topText, canvas.width / 2, y)
    ctx.fillText(options.topText, canvas.width / 2, y)
  }

  if (options.bottomText) {
    const y = canvas.height - 25
    ctx.strokeText(options.bottomText, canvas.width / 2, y)
    ctx.fillText(options.bottomText, canvas.width / 2, y)
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Watermark generation failed.')
  return blob
}

/**
 * Applies visual filters to an image.
 */
export async function applyFilters(
  file: File,
  filters: {
    brightness: number // 100 is default
    contrast: number // 100 is default
    saturation: number // 100 is default
    blur: number // 0 is default
    grayscale: number // 0 is default
    invert: number // 0 is default
    sepia: number // 0 is default
  }
): Promise<Blob> {
  const img = await loadImage(file)
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context.')

  ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) blur(${filters.blur}px) grayscale(${filters.grayscale}%) invert(${filters.invert}%) sepia(${filters.sepia}%)`
  ctx.drawImage(img, 0, 0)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Filter application failed.')
  return blob
}

/**
 * Rasterizes an SVG string/file into a high-DPI PNG.
 */
export async function svgToPng(svgFile: File, scaleMultiplier: number = 2): Promise<Blob> {
  const text = await svgFile.text()
  const blobSvg = new Blob([text], { type: 'image/svg+xml;charset=utf-8' })
  const img = await loadImage(blobSvg)

  const canvas = document.createElement('canvas')
  canvas.width = (img.width || 800) * scaleMultiplier
  canvas.height = (img.height || 600) * scaleMultiplier
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context.')

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('SVG to PNG failed.')
  return blob
}
