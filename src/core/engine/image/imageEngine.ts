/**
 * Image Processing Engine for MicroTools
 * 100% Client-side processing using HTML5 Canvas, typed arrays, and browser-native APIs.
 */

export interface ImageDimensions {
  width: number
  height: number
}

export interface CompressResult {
  blob: Blob
  originalSize: number
  compressedSize: number
  savingsPercent: number
  width: number
  height: number
  format: string
}

export interface WatermarkTextConfig {
  text: string
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'tile'
  fontSize?: number
  textColor?: string
  opacity?: number
  stroke?: boolean
}

export interface WatermarkImageConfig {
  logoFile: File | Blob
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  scale?: number // 0.1 to 0.8 relative to image width
  opacity?: number
}

export interface EnhanceOptions {
  brightness?: number // -100 to 100
  contrast?: number // -100 to 100
  saturation?: number // -100 to 100
  exposure?: number // -100 to 100
  sharpness?: number // 0 to 100
  sepia?: number // 0 to 100
  grayscale?: number // 0 to 100
  invert?: boolean
}

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
      reject(new Error('Failed to decode image file. Format may be unsupported or corrupted.'))
    }
    img.src = url
  })
}

/**
 * Quickly inspects image dimensions.
 */
export async function getImageDimensions(fileOrBlob: Blob): Promise<ImageDimensions> {
  const img = await loadImage(fileOrBlob)
  return { width: img.naturalWidth || img.width, height: img.naturalHeight || img.height }
}

/**
 * 1. Advanced Image Compression
 * Supports format change, quality control, and max dimension limits.
 */
export async function compressImageAdvanced(
  file: File,
  options: {
    quality?: number
    maxWidth?: number
    maxHeight?: number
    format?: 'image/jpeg' | 'image/webp' | 'image/png'
  } = {}
): Promise<CompressResult> {
  const img = await loadImage(file)
  let width = img.naturalWidth || img.width
  let height = img.naturalHeight || img.height

  const maxWidth = options.maxWidth
  const maxHeight = options.maxHeight

  // Aspect-ratio preserving downscaling if bounds provided
  if (maxWidth && width > maxWidth) {
    height = Math.round((height * maxWidth) / width)
    width = maxWidth
  }
  if (maxHeight && height > maxHeight) {
    width = Math.round((width * maxHeight) / height)
    height = maxHeight
  }

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, width)
  canvas.height = Math.max(1, height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not initialize canvas rendering context.')

  // Detect output format
  let outputFormat = options.format
  if (!outputFormat) {
    if (file.type === 'image/webp') outputFormat = 'image/webp'
    else if (file.type === 'image/png') outputFormat = 'image/png'
    else outputFormat = 'image/jpeg'
  }

  // If converting to JPEG, fill white background to prevent transparent areas turning black
  if (outputFormat === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
  }

  ctx.drawImage(img, 0, 0, width, height)

  const quality = options.quality !== undefined ? options.quality : 0.8
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, outputFormat, quality)
  )

  if (!blob) throw new Error('Failed to encode compressed image.')

  const originalSize = file.size
  const compressedSize = blob.size
  const diff = originalSize - compressedSize
  const savingsPercent = diff > 0 ? Math.round((diff / originalSize) * 100) : 0

  return {
    blob,
    originalSize,
    compressedSize,
    savingsPercent,
    width,
    height,
    format: outputFormat,
  }
}

/**
 * 2. High-Quality Image Resizing
 */
export async function resizeImageDimensions(
  file: File,
  options: {
    targetWidth: number
    targetHeight: number
    format?: 'image/png' | 'image/jpeg' | 'image/webp'
    quality?: number
  }
): Promise<Blob> {
  const img = await loadImage(file)
  const width = Math.max(1, Math.round(options.targetWidth))
  const height = Math.max(1, Math.round(options.targetHeight))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context not available.')

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  const format = options.format || (file.type === 'image/png' ? 'image/png' : 'image/jpeg')
  if (format === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
  }

  ctx.drawImage(img, 0, 0, width, height)

  const quality = options.quality ?? 0.92
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, format, quality))
  if (!blob) throw new Error('Image resize failed.')
  return blob
}

/**
 * 3. Crop Image Region
 */
export async function cropImageCanvas(
  file: File,
  options: {
    x: number
    y: number
    width: number
    height: number
    rotation?: number
    format?: 'image/png' | 'image/jpeg' | 'image/webp'
    quality?: number
  }
): Promise<Blob> {
  const img = await loadImage(file)
  const srcW = img.naturalWidth || img.width
  const srcH = img.naturalHeight || img.height

  // Sanitize bounds
  const x = Math.max(0, Math.min(srcW - 1, Math.round(options.x)))
  const y = Math.max(0, Math.min(srcH - 1, Math.round(options.y)))
  const w = Math.max(1, Math.min(srcW - x, Math.round(options.width)))
  const h = Math.max(1, Math.min(srcH - y, Math.round(options.height)))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context not available.')

  const format = options.format || (file.type === 'image/png' ? 'image/png' : 'image/jpeg')
  if (format === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
  }

  ctx.drawImage(img, x, y, w, h, 0, 0, w, h)

  const quality = options.quality ?? 0.95
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, format, quality))
  if (!blob) throw new Error('Cropping failed.')
  return blob
}

/**
 * 4. Universal Image Format Converter
 * Converts between PNG, JPEG, WebP, BMP.
 */
export async function convertFormatDirect(
  file: File,
  options: {
    targetFormat: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/bmp'
    quality?: number
    backgroundColor?: string
  }
): Promise<Blob> {
  const img = await loadImage(file)
  const width = img.naturalWidth || img.width
  const height = img.naturalHeight || img.height

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context not available.')

  // Background handling for formats without alpha channel (JPEG / BMP)
  if (options.targetFormat === 'image/jpeg' || options.targetFormat === 'image/bmp') {
    ctx.fillStyle = options.backgroundColor || '#ffffff'
    ctx.fillRect(0, 0, width, height)
  }

  ctx.drawImage(img, 0, 0)

  // Pure JavaScript 24-bit BMP encoder for universal browser compatibility
  if (options.targetFormat === 'image/bmp') {
    const imgData = ctx.getImageData(0, 0, width, height)
    return encodeBmp(imgData)
  }

  const quality = options.quality ?? 0.92
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, options.targetFormat, quality)
  )

  if (!blob) throw new Error(`Conversion to ${options.targetFormat} failed.`)
  return blob
}

/**
 * Encodes Canvas ImageData into standard Windows 24-bit BMP Blob.
 */
function encodeBmp(imageData: ImageData): Blob {
  const { width, height, data } = imageData
  const rowSize = Math.floor((24 * width + 31) / 32) * 4
  const pixelArraySize = rowSize * height
  const fileHeaderSize = 14
  const dibHeaderSize = 40
  const fileSize = fileHeaderSize + dibHeaderSize + pixelArraySize

  const buffer = new ArrayBuffer(fileSize)
  const view = new DataView(buffer)

  // --- BMP File Header (14 bytes) ---
  view.setUint8(0, 0x42) // 'B'
  view.setUint8(1, 0x4d) // 'M'
  view.setUint32(2, fileSize, true)
  view.setUint16(6, 0, true) // Reserved 1
  view.setUint16(8, 0, true) // Reserved 2
  view.setUint32(10, fileHeaderSize + dibHeaderSize, true) // Offset to pixel array

  // --- DIB Header (BITMAPINFOHEADER - 40 bytes) ---
  view.setUint32(14, dibHeaderSize, true)
  view.setInt32(18, width, true)
  view.setInt32(22, height, true) // Positive height: bottom-up
  view.setUint16(26, 1, true) // Planes
  view.setUint16(28, 24, true) // 24-bit BGR
  view.setUint32(30, 0, true) // BI_RGB (uncompressed)
  view.setUint32(34, pixelArraySize, true)
  view.setInt32(38, 2835, true) // Horizontal resolution ~72 DPI
  view.setInt32(42, 2835, true) // Vertical resolution ~72 DPI
  view.setUint32(46, 0, true) // Colors in color table
  view.setUint32(50, 0, true) // Important color count

  // --- Pixel Array (Bottom-up, BGR format, padded to 4 bytes per row) ---
  let offset = fileHeaderSize + dibHeaderSize
  for (let y = height - 1; y >= 0; y--) {
    let rowOffset = offset
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4
      view.setUint8(rowOffset++, data[srcIdx + 2]) // Blue
      view.setUint8(rowOffset++, data[srcIdx + 1]) // Green
      view.setUint8(rowOffset++, data[srcIdx]) // Red
    }
    // Padding
    while (rowOffset < offset + rowSize) {
      view.setUint8(rowOffset++, 0)
    }
    offset += rowSize
  }

  return new Blob([buffer], { type: 'image/bmp' })
}

/**
 * 5. Rotate and Flip Image
 * Supports 90°, 180°, 270°, or arbitrary angle with dynamic canvas recalculation.
 */
export async function rotateAndFlipImage(
  file: File,
  options: {
    degrees?: number
    flipH?: boolean
    flipV?: boolean
    format?: 'image/png' | 'image/jpeg' | 'image/webp'
    quality?: number
  } = {}
): Promise<Blob> {
  const img = await loadImage(file)
  const origW = img.naturalWidth || img.width
  const origH = img.naturalHeight || img.height

  const deg = options.degrees || 0
  const rad = (deg * Math.PI) / 180

  // Calculate new bounding box dimensions for arbitrary angles
  const absCos = Math.abs(Math.cos(rad))
  const absSin = Math.abs(Math.sin(rad))
  const newW = Math.max(1, Math.round(origW * absCos + origH * absSin))
  const newH = Math.max(1, Math.round(origW * absSin + origH * absCos))

  const canvas = document.createElement('canvas')
  canvas.width = newW
  canvas.height = newH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context not available.')

  const format = options.format || (file.type === 'image/png' ? 'image/png' : 'image/jpeg')
  if (format === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, newW, newH)
  }

  ctx.translate(newW / 2, newH / 2)
  ctx.rotate(rad)
  ctx.scale(options.flipH ? -1 : 1, options.flipV ? -1 : 1)
  ctx.drawImage(img, -origW / 2, -origH / 2)

  const quality = options.quality ?? 0.95
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, format, quality))
  if (!blob) throw new Error('Rotation failed.')
  return blob
}

/**
 * 6. Advanced Watermark Stamping (Text & Image)
 */
export async function applyWatermarkAdvanced(
  file: File,
  options: {
    textConfig?: WatermarkTextConfig
    imageConfig?: WatermarkImageConfig
    format?: 'image/png' | 'image/jpeg' | 'image/webp'
    quality?: number
  }
): Promise<Blob> {
  const img = await loadImage(file)
  const width = img.naturalWidth || img.width
  const height = img.naturalHeight || img.height

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context not available.')

  const format = options.format || (file.type === 'image/png' ? 'image/png' : 'image/jpeg')
  if (format === 'image/jpeg') {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
  }

  ctx.drawImage(img, 0, 0)

  // 1. Text Watermark
  if (options.textConfig && options.textConfig.text.trim()) {
    const cfg = options.textConfig
    const text = cfg.text.trim()
    const fontSize = cfg.fontSize || Math.max(24, Math.round(width / 22))
    const opacity = cfg.opacity !== undefined ? cfg.opacity : 0.35
    const textColor = cfg.textColor || '#ffffff'

    ctx.save()
    ctx.globalAlpha = opacity
    ctx.font = `bold ${fontSize}px sans-serif`
    ctx.fillStyle = textColor
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'
    ctx.lineWidth = Math.max(2, Math.round(fontSize / 10))

    if (cfg.position === 'tile') {
      const stepX = Math.max(160, Math.round(fontSize * 6))
      const stepY = Math.max(100, Math.round(fontSize * 4))
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (let x = stepX / 2; x < width; x += stepX) {
        for (let y = stepY / 2; y < height; y += stepY) {
          ctx.save()
          ctx.translate(x, y)
          ctx.rotate((-30 * Math.PI) / 180)
          if (cfg.stroke) ctx.strokeText(text, 0, 0)
          ctx.fillText(text, 0, 0)
          ctx.restore()
        }
      }
    } else {
      let x = width / 2
      let y = height / 2
      let align: CanvasTextAlign = 'center'
      let baseline: CanvasTextBaseline = 'middle'
      const pad = 30

      if (cfg.position === 'top-left') {
        x = pad
        y = pad
        align = 'left'
        baseline = 'top'
      } else if (cfg.position === 'top-right') {
        x = width - pad
        y = pad
        align = 'right'
        baseline = 'top'
      } else if (cfg.position === 'bottom-left') {
        x = pad
        y = height - pad
        align = 'left'
        baseline = 'bottom'
      } else if (cfg.position === 'bottom-right') {
        x = width - pad
        y = height - pad
        align = 'right'
        baseline = 'bottom'
      }

      ctx.textAlign = align
      ctx.textBaseline = baseline
      if (cfg.stroke) ctx.strokeText(text, x, y)
      ctx.fillText(text, x, y)
    }
    ctx.restore()
  }

  // 2. Image Logo Watermark
  if (options.imageConfig && options.imageConfig.logoFile) {
    const cfg = options.imageConfig
    const logoImg = await loadImage(cfg.logoFile)
    const logoAspect = (logoImg.naturalWidth || logoImg.width) / (logoImg.naturalHeight || logoImg.height)

    const scale = cfg.scale || 0.2
    const logoW = Math.round(width * scale)
    const logoH = Math.round(logoW / logoAspect)
    const opacity = cfg.opacity !== undefined ? cfg.opacity : 0.6
    const pad = 25

    let lx = width / 2 - logoW / 2
    let ly = height / 2 - logoH / 2

    if (cfg.position === 'top-left') {
      lx = pad
      ly = pad
    } else if (cfg.position === 'top-right') {
      lx = width - logoW - pad
      ly = pad
    } else if (cfg.position === 'bottom-left') {
      lx = pad
      ly = height - logoH - pad
    } else if (cfg.position === 'bottom-right') {
      lx = width - logoW - pad
      ly = height - logoH - pad
    }

    ctx.save()
    ctx.globalAlpha = opacity
    ctx.drawImage(logoImg, lx, ly, logoW, logoH)
    ctx.restore()
  }

  const quality = options.quality ?? 0.95
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, format, quality))
  if (!blob) throw new Error('Watermark application failed.')
  return blob
}

/**
 * 7. Image Enhancer
 * Adjusts brightness, contrast, saturation, exposure, and applies 3x3 convolution sharpness kernel.
 */
export async function enhanceImage(
  file: File,
  options: EnhanceOptions = {},
  outputFormat: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/png'
): Promise<Blob> {
  const img = await loadImage(file)
  const width = img.naturalWidth || img.width
  const height = img.naturalHeight || img.height

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context not available.')

  // CSS filter string for standard color parameters
  const b = 100 + (options.brightness || 0)
  const c = 100 + (options.contrast || 0)
  const s = 100 + (options.saturation || 0)
  const sep = options.sepia || 0
  const gray = options.grayscale || 0
  const inv = options.invert ? 100 : 0

  ctx.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%) sepia(${sep}%) grayscale(${gray}%) invert(${inv}%)`
  ctx.drawImage(img, 0, 0)
  ctx.filter = 'none'

  // Pixel-level convolution processing for Sharpness & Exposure
  const sharpness = options.sharpness || 0
  const exposure = options.exposure || 0

  if (sharpness > 0 || exposure !== 0) {
    const imgData = ctx.getImageData(0, 0, width, height)
    const d = imgData.data

    // Exposure adjustment
    if (exposure !== 0) {
      const expFactor = Math.pow(2, exposure / 50)
      for (let i = 0; i < d.length; i += 4) {
        d[i] = Math.min(255, Math.max(0, d[i] * expFactor))
        d[i + 1] = Math.min(255, Math.max(0, d[i + 1] * expFactor))
        d[i + 2] = Math.min(255, Math.max(0, d[i + 2] * expFactor))
      }
    }

    // 3x3 Laplacian Unsharp Mask Kernel
    if (sharpness > 0) {
      const k = (sharpness / 100) * 0.8
      const kernel = [
        0, -k, 0,
        -k, 1 + 4 * k, -k,
        0, -k, 0,
      ]

      const copy = new Uint8ClampedArray(d)
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const px = (y * width + x) * 4
          for (let c = 0; c < 3; c++) {
            let sum = 0
            sum += copy[((y - 1) * width + (x - 1)) * 4 + c] * kernel[0]
            sum += copy[((y - 1) * width + x) * 4 + c] * kernel[1]
            sum += copy[((y - 1) * width + (x + 1)) * 4 + c] * kernel[2]
            sum += copy[(y * width + (x - 1)) * 4 + c] * kernel[3]
            sum += copy[(y * width + x) * 4 + c] * kernel[4]
            sum += copy[(y * width + (x + 1)) * 4 + c] * kernel[5]
            sum += copy[((y + 1) * width + (x - 1)) * 4 + c] * kernel[6]
            sum += copy[((y + 1) * width + x) * 4 + c] * kernel[7]
            sum += copy[((y + 1) * width + (x + 1)) * 4 + c] * kernel[8]
            d[px + c] = Math.min(255, Math.max(0, sum))
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0)
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, outputFormat, 0.95))
  if (!blob) throw new Error('Image enhancement failed.')
  return blob
}

/**
 * 8. Client-Side Color-Key / Chroma Background Remover
 * Removes solid, studio, white, or green screen backgrounds by calculating color distance in RGB space.
 */
export async function removeColorBackground(
  file: File,
  options: {
    targetColorHex: string
    tolerance: number // 5 to 100 (threshold)
    softness?: number // 0 to 40 (feathering edge)
  }
): Promise<Blob> {
  const img = await loadImage(file)
  const width = img.naturalWidth || img.width
  const height = img.naturalHeight || img.height

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context not available.')

  ctx.drawImage(img, 0, 0)
  const imgData = ctx.getImageData(0, 0, width, height)
  const d = imgData.data

  // Parse HEX color into RGB
  let hex = options.targetColorHex.replace('#', '')
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('')
  const targetR = parseInt(hex.substring(0, 2), 16) || 255
  const targetG = parseInt(hex.substring(2, 4), 16) || 255
  const targetB = parseInt(hex.substring(4, 6), 16) || 255

  const tolerance = options.tolerance || 35
  const softness = options.softness || 15

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i]
    const g = d[i + 1]
    const b = d[i + 2]

    // Euclidean distance in RGB color cube
    const dist = Math.sqrt(
      Math.pow(r - targetR, 2) + Math.pow(g - targetG, 2) + Math.pow(b - targetB, 2)
    )

    if (dist < tolerance) {
      d[i + 3] = 0 // Fully transparent
    } else if (dist < tolerance + softness) {
      // Smooth edge alpha feathering
      const alphaFraction = (dist - tolerance) / softness
      d[i + 3] = Math.round(d[i + 3] * alphaFraction)
    }
  }

  ctx.putImageData(imgData, 0, 0)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Background removal failed.')
  return blob
}

/**
 * Extracts dominant color palette from image pixels.
 */
export async function extractColorPalette(file: File, colorCount: number = 6): Promise<string[]> {
  const img = await loadImage(file)
  const canvas = document.createElement('canvas')
  const sampleSize = 100
  canvas.width = sampleSize
  canvas.height = sampleSize
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context.')

  ctx.drawImage(img, 0, 0, sampleSize, sampleSize)
  const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize).data

  const colorBuckets: Record<string, { r: number; g: number; b: number; count: number }> = {}

  for (let i = 0; i < imgData.length; i += 4) {
    const a = imgData[i + 3]
    if (a < 128) continue

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
  canvas.width = img.naturalWidth || img.width
  canvas.height = img.naturalHeight || img.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get canvas context.')

  ctx.drawImage(img, 0, 0)
  const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, 0.95))
  if (!blob) throw new Error('EXIF strip failed.')
  return blob
}
