import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'

// Configure PDF.js worker in browser
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.mjs',
      import.meta.url
    ).toString()
  } catch {
    // fallback or cdn if necessary
  }
}

export interface RenderedPdfPage {
  pageNumber: number
  blob: Blob
  width: number
  height: number
}

export interface ExtractedPdfTextResult {
  text: string
  pageCount: number
  pagesWithText: number
  isScannedOrEmpty: boolean
}

/**
 * 1. Merges multiple PDF files into a single PDF document in the specified order.
 */
export async function mergePdfs(
  files: File[],
  onProgress?: (progress: number, status: string) => void
): Promise<Uint8Array> {
  if (files.length < 2) {
    throw new Error('Please select at least two PDF files to merge.')
  }

  onProgress?.(5, 'Initializing target document...')
  const mergedPdf = await PDFDocument.create()

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    onProgress?.(
      10 + Math.round((i / files.length) * 75),
      `Reading document ${i + 1} of ${files.length} (${file.name})...`
    )

    const arrayBuffer = await file.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
    const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices())

    for (const page of copiedPages) {
      mergedPdf.addPage(page)
    }
  }

  onProgress?.(90, 'Serializing merged document...')
  const mergedBytes = await mergedPdf.save()
  onProgress?.(100, 'Done!')
  return mergedBytes
}

/**
 * 2. Splits a PDF document by extracting specified pages or ranges (e.g. "1-3, 5, 7-10").
 */
export async function splitPdf(
  file: File,
  pageRangeStr: string,
  onProgress?: (progress: number, status: string) => void
): Promise<Uint8Array> {
  onProgress?.(10, 'Reading original PDF...')
  const arrayBuffer = await file.arrayBuffer()
  const sourcePdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
  const totalPages = sourcePdf.getPageCount()

  if (totalPages === 0) {
    throw new Error('The selected PDF contains no pages.')
  }

  // Parse page ranges (1-indexed into 0-indexed)
  const targetIndices = new Set<number>()
  const parts = pageRangeStr.split(',').map((p) => p.trim()).filter(Boolean)

  if (parts.length === 0) {
    throw new Error('Please specify at least one page number or range (e.g. 1-3, 5).')
  }

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => s.trim())
      const start = parseInt(startStr, 10)
      const end = parseInt(endStr, 10)
      if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages || start > end) {
        throw new Error(`Invalid page range "${part}". Must be between 1 and ${totalPages}.`)
      }
      for (let p = start; p <= end; p++) {
        targetIndices.add(p - 1)
      }
    } else {
      const p = parseInt(part, 10)
      if (isNaN(p) || p < 1 || p > totalPages) {
        throw new Error(`Invalid page number "${part}". Total pages: ${totalPages}.`)
      }
      targetIndices.add(p - 1)
    }
  }

  const sortedIndices = Array.from(targetIndices).sort((a, b) => a - b)
  if (sortedIndices.length === 0) {
    throw new Error('No valid pages selected.')
  }

  onProgress?.(40, 'Extracting selected pages...')
  const newPdf = await PDFDocument.create()
  const copiedPages = await newPdf.copyPages(sourcePdf, sortedIndices)

  for (const page of copiedPages) {
    newPdf.addPage(page)
  }

  onProgress?.(85, 'Saving extracted PDF...')
  const pdfBytes = await newPdf.save()
  onProgress?.(100, 'Done!')
  return pdfBytes
}

/**
 * 3. Extracts a specific list of 0-indexed page indices into a new standalone PDF document.
 */
export async function extractPdfPages(
  file: File,
  pageIndices: number[], // 0-indexed
  onProgress?: (progress: number, status: string) => void
): Promise<Uint8Array> {
  if (pageIndices.length === 0) {
    throw new Error('Please select at least one page to extract.')
  }

  onProgress?.(15, 'Loading PDF...')
  const arrayBuffer = await file.arrayBuffer()
  const sourcePdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
  const newPdf = await PDFDocument.create()

  onProgress?.(45, `Extracting ${pageIndices.length} pages...`)
  const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices)
  for (const page of copiedPages) {
    newPdf.addPage(page)
  }

  onProgress?.(85, 'Generating extracted document...')
  const bytes = await newPdf.save()
  onProgress?.(100, 'Done!')
  return bytes
}

/**
 * 4. Rotates all or specific pages of a PDF by 90, 180, or 270 degrees.
 */
export async function rotatePdf(
  file: File,
  degreesToAdd: number,
  pageIndices?: number[], // 0-indexed, if undefined rotates all
  onProgress?: (progress: number, status: string) => void
): Promise<Uint8Array> {
  onProgress?.(20, 'Loading PDF document...')
  const buffer = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
  const pages = pdfDoc.getPages()

  onProgress?.(50, `Rotating pages by ${degreesToAdd}°...`)
  const targetSet = pageIndices ? new Set(pageIndices) : null

  for (let i = 0; i < pages.length; i++) {
    if (!targetSet || targetSet.has(i)) {
      const page = pages[i]
      const currentRotation = page.getRotation().angle
      page.setRotation(degrees((currentRotation + degreesToAdd) % 360))
    }
  }

  onProgress?.(85, 'Saving rotated PDF...')
  const bytes = await pdfDoc.save()
  onProgress?.(100, 'Done!')
  return bytes
}

/**
 * 5 & 6. Converts a list of image files (JPEG, PNG, WebP) into a single clean PDF document.
 * Supports image rotation offsets and orientation.
 */
export async function imagesToPdf(
  images: File[],
  onProgress?: (progress: number, status: string) => void,
  options?: {
    rotations?: number[] // rotation degrees per image (0, 90, 180, 270)
  }
): Promise<Uint8Array> {
  if (images.length === 0) {
    throw new Error('Please select at least one image.')
  }

  onProgress?.(10, 'Initializing PDF...')
  const pdfDoc = await PDFDocument.create()

  for (let i = 0; i < images.length; i++) {
    const file = images[i]
    const rotation = options?.rotations?.[i] || 0

    onProgress?.(
      15 + Math.round((i / images.length) * 75),
      `Embedding image ${i + 1} of ${images.length} (${file.name})...`
    )

    let buffer = await file.arrayBuffer()

    // If rotation requested or format requires normalization, process through canvas
    if (rotation !== 0 || (!file.type.includes('jpeg') && !file.type.includes('png'))) {
      const bitmap = await createImageBitmap(file)
      const canvas = document.createElement('canvas')
      const isSideways = rotation === 90 || rotation === 270
      canvas.width = isSideways ? bitmap.height : bitmap.width
      canvas.height = isSideways ? bitmap.width : bitmap.height

      const ctx = canvas.getContext('2d')!
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2)

      const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (!pngBlob) throw new Error(`Failed to process image: ${file.name}`)
      buffer = await pngBlob.arrayBuffer()
    }

    let embeddedImage
    if (file.type === 'image/jpeg' && rotation === 0) {
      embeddedImage = await pdfDoc.embedJpg(buffer)
    } else {
      embeddedImage = await pdfDoc.embedPng(buffer).catch(async () => {
        // Fallback: draw through canvas to get clean PNG bytes
        const bitmap = await createImageBitmap(file)
        const canvas = document.createElement('canvas')
        canvas.width = bitmap.width
        canvas.height = bitmap.height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(bitmap, 0, 0)
        const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
        if (!pngBlob) throw new Error(`Failed to process image: ${file.name}`)
        const pngBuffer = await pngBlob.arrayBuffer()
        return await pdfDoc.embedPng(pngBuffer)
      })
    }

    const { width, height } = embeddedImage
    const page = pdfDoc.addPage([width, height])
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width,
      height,
    })
  }

  onProgress?.(90, 'Generating PDF bytes...')
  const bytes = await pdfDoc.save()
  onProgress?.(100, 'Done!')
  return bytes
}

/**
 * 7 & 8. Renders actual PDF pages to high-resolution JPEG or PNG images using Mozilla's pdfjs-dist.
 */
export async function renderPdfPagesToImages(
  file: File,
  options: {
    format: 'image/jpeg' | 'image/png'
    scale?: number
    pageIndices?: number[] // 0-indexed, undefined renders all
  },
  onProgress?: (progress: number, status: string) => void
): Promise<RenderedPdfPage[]> {
  onProgress?.(10, 'Initializing PDF renderer...')
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const totalPages = pdf.numPages

  if (totalPages === 0) {
    throw new Error('PDF contains no renderable pages.')
  }

  const scale = options.scale || 1.5
  const pagesToRender = options.pageIndices
    ? options.pageIndices.filter((idx) => idx >= 0 && idx < totalPages).map((idx) => idx + 1)
    : Array.from({ length: totalPages }, (_, i) => i + 1)

  const results: RenderedPdfPage[] = []

  for (let i = 0; i < pagesToRender.length; i++) {
    const pageNum = pagesToRender[i]
    onProgress?.(
      15 + Math.round((i / pagesToRender.length) * 80),
      `Rendering page ${pageNum} of ${totalPages}...`
    )

    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale })

    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height

    const ctx = canvas.getContext('2d')!
    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, options.format, 0.92)
    )

    if (blob) {
      results.push({
        pageNumber: pageNum,
        blob,
        width: viewport.width,
        height: viewport.height,
      })
    }
  }

  onProgress?.(100, 'Done!')
  return results
}

/**
 * 9. Extracts actual selectable text content from a PDF document using pdfjs-dist.
 */
export async function extractPdfTextContent(
  file: File,
  onProgress?: (progress: number, status: string) => void
): Promise<ExtractedPdfTextResult> {
  onProgress?.(10, 'Opening PDF for text extraction...')
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const totalPages = pdf.numPages

  const pageTexts: string[] = []
  let pagesWithText = 0

  for (let i = 1; i <= totalPages; i++) {
    onProgress?.(
      15 + Math.round((i / totalPages) * 80),
      `Extracting text from page ${i} of ${totalPages}...`
    )

    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()

    // Reconstruct words with space spacing
    const pageString = textContent.items
      .map((item: any) => item.str)
      .filter(Boolean)
      .join(' ')
      .trim()

    if (pageString.length > 0) {
      pagesWithText++
      pageTexts.push(`--- Page ${i} ---\n${pageString}\n`)
    } else {
      pageTexts.push(`--- Page ${i} ---\n[No selectable text found on this page]\n`)
    }
  }

  onProgress?.(100, 'Text extraction complete.')
  const fullText = pageTexts.join('\n')
  return {
    text: fullText,
    pageCount: totalPages,
    pagesWithText,
    isScannedOrEmpty: pagesWithText === 0,
  }
}

/**
 * 10. Genuine client-side PDF stream optimization and compression using pdf-lib object streams.
 */
export async function compressPdfDocument(
  file: File,
  onProgress?: (progress: number, status: string) => void
): Promise<{
  bytes: Uint8Array
  originalSize: number
  compressedSize: number
  savingsPercent: number
}> {
  onProgress?.(20, 'Analyzing PDF document structure...')
  const buffer = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })

  onProgress?.(60, 'Packing object streams and removing unreferenced entries...')
  const compressedBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
  })

  const originalSize = file.size
  const compressedSize = compressedBytes.byteLength
  const diff = originalSize - compressedSize
  const savingsPercent = diff > 0 ? Math.round((diff / originalSize) * 100) : 0

  onProgress?.(100, 'Optimization complete.')
  return {
    bytes: compressedBytes,
    originalSize,
    compressedSize,
    savingsPercent,
  }
}

/**
 * 11. Adds a vector text watermark across PDF pages with custom opacity, rotation, and size.
 */
export async function watermarkPdf(
  file: File,
  watermarkText: string,
  options: {
    opacity?: number
    size?: number
    rotation?: number
    color?: { r: number; g: number; b: number }
  } = {},
  onProgress?: (progress: number, status: string) => void
): Promise<Uint8Array> {
  if (!watermarkText.trim()) {
    throw new Error('Please enter watermark text.')
  }

  onProgress?.(15, 'Loading PDF...')
  const buffer = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const pages = pdfDoc.getPages()
  const opacity = options.opacity ?? 0.3
  const size = options.size ?? 48
  const rotation = options.rotation ?? 45
  const color = options.color || { r: 0.5, g: 0.5, b: 0.5 }

  onProgress?.(45, `Applying watermark across ${pages.length} pages...`)

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]
    const { width, height } = page.getSize()
    const textWidth = font.widthOfTextAtSize(watermarkText, size)
    const textHeight = font.heightAtSize(size)

    page.drawText(watermarkText, {
      x: width / 2 - textWidth / 2,
      y: height / 2 - textHeight / 2,
      size,
      font,
      color: rgb(color.r, color.g, color.b),
      opacity,
      rotate: degrees(rotation),
    })
  }

  onProgress?.(85, 'Saving watermarked PDF...')
  const bytes = await pdfDoc.save()
  onProgress?.(100, 'Done!')
  return bytes
}

/**
 * 12. Removes owner restrictions and permission passwords client-side.
 */
export async function unlockPdf(
  file: File,
  _password?: string,
  onProgress?: (progress: number, status: string) => void
): Promise<{ bytes: Uint8Array; wasEncrypted: boolean }> {
  onProgress?.(25, 'Loading document...')
  const buffer = await file.arrayBuffer()

  // Load with ignoreEncryption to strip owner permission flags
  const pdfDoc = await PDFDocument.load(buffer, {
    ignoreEncryption: true,
  })

  onProgress?.(60, 'Re-serializing clean document without restriction tables...')
  const newPdf = await PDFDocument.create()
  const copiedPages = await newPdf.copyPages(pdfDoc, pdfDoc.getPageIndices())

  for (const page of copiedPages) {
    newPdf.addPage(page)
  }

  onProgress?.(90, 'Finalizing unrestricted PDF...')
  const bytes = await newPdf.save()
  onProgress?.(100, 'Document unlocked.')
  return {
    bytes,
    wasEncrypted: pdfDoc.isEncrypted,
  }
}

/**
 * Inspects PDF page count and basic metadata.
 */
export async function inspectPdf(file: File): Promise<{ pageCount: number; title?: string }> {
  const buffer = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
  return {
    pageCount: pdfDoc.getPageCount(),
    title: pdfDoc.getTitle(),
  }
}

/**
 * 13. Extracts tabular structures from PDF pages by clustering text items by 2D coordinates.
 */
export async function extractPdfTabularData(
  file: File,
  onProgress?: (progress: number, status: string) => void
): Promise<(string | number)[][]> {
  onProgress?.(10, 'Opening PDF for tabular extraction...')
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const totalPages = pdf.numPages

  const allRows: (string | number)[][] = []

  for (let i = 1; i <= totalPages; i++) {
    onProgress?.(
      15 + Math.round((i / totalPages) * 75),
      `Analyzing table rows on page ${i} of ${totalPages}...`
    )

    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()

    interface TextItemPos {
      str: string
      x: number
      y: number
    }

    const items: TextItemPos[] = []
    for (const item of textContent.items as any[]) {
      if (item.str && item.str.trim()) {
        items.push({
          str: item.str.trim(),
          x: Math.round(item.transform[4]),
          y: Math.round(item.transform[5]),
        })
      }
    }

    // Sort items top-to-bottom (descending Y in PDF coordinate space)
    items.sort((a, b) => b.y - a.y)

    const yGroups: { y: number; items: TextItemPos[] }[] = []
    for (const item of items) {
      let matchedGroup = yGroups.find((g) => Math.abs(g.y - item.y) <= 4)
      if (!matchedGroup) {
        matchedGroup = { y: item.y, items: [] }
        yGroups.push(matchedGroup)
      }
      matchedGroup.items.push(item)
    }

    // Sort each group left-to-right (ascending X)
    for (const group of yGroups) {
      group.items.sort((a, b) => a.x - b.x)
      const row = group.items.map((it) => {
        const cleanVal = it.str.replace(/,/g, '')
        const num = Number(cleanVal)
        return !isNaN(num) && cleanVal !== '' && !/^[a-zA-Z]/.test(cleanVal) ? num : it.str
      })
      if (row.length > 0) {
        allRows.push(row)
      }
    }
  }

  onProgress?.(100, 'Tabular text extraction complete!')
  return allRows
}
