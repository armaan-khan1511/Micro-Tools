import { PDFDocument, degrees } from 'pdf-lib'

/**
 * Merges multiple PDF files into a single PDF document in the specified order.
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
 * Splits a PDF document by extracting specified pages or ranges (e.g. "1-3, 5, 7-10").
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
 * Converts a list of image files (JPEG, PNG) into a single clean PDF document.
 */
export async function imagesToPdf(
  images: File[],
  onProgress?: (progress: number, status: string) => void
): Promise<Uint8Array> {
  if (images.length === 0) {
    throw new Error('Please select at least one image.')
  }

  onProgress?.(10, 'Initializing PDF...')
  const pdfDoc = await PDFDocument.create()

  for (let i = 0; i < images.length; i++) {
    const file = images[i]
    onProgress?.(
      15 + Math.round((i / images.length) * 75),
      `Embedding image ${i + 1} of ${images.length} (${file.name})...`
    )

    const buffer = await file.arrayBuffer()
    let embeddedImage

    if (file.type === 'image/jpeg' || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')) {
      embeddedImage = await pdfDoc.embedJpg(buffer)
    } else {
      // For PNG or other formats converted to PNG
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
 * Rotates all or specific pages of a PDF by 90, 180, or 270 degrees.
 */
export async function rotatePdf(
  file: File,
  degreesToAdd: number,
  onProgress?: (progress: number, status: string) => void
): Promise<Uint8Array> {
  onProgress?.(20, 'Loading PDF document...')
  const buffer = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
  const pages = pdfDoc.getPages()

  onProgress?.(50, `Rotating ${pages.length} pages by ${degreesToAdd}°...`)
  for (const page of pages) {
    const currentRotation = page.getRotation().angle
    page.setRotation(degrees((currentRotation + degreesToAdd) % 360))
  }

  onProgress?.(85, 'Saving rotated PDF...')
  const bytes = await pdfDoc.save()
  onProgress?.(100, 'Done!')
  return bytes
}

/**
 * Inspects PDF page count and basic details.
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
 * Deletes or rearranges pages in a PDF document.
 */
export async function organizePdfPages(
  file: File,
  keepPageIndices: number[], // 0-indexed
  onProgress?: (progress: number, status: string) => void
): Promise<Uint8Array> {
  onProgress?.(20, 'Loading PDF document...')
  const buffer = await file.arrayBuffer()
  const sourcePdf = await PDFDocument.load(buffer, { ignoreEncryption: true })
  const newPdf = await PDFDocument.create()

  onProgress?.(50, 'Organizing pages...')
  const copiedPages = await newPdf.copyPages(sourcePdf, keepPageIndices)
  for (const page of copiedPages) {
    newPdf.addPage(page)
  }

  onProgress?.(85, 'Finalizing document...')
  const bytes = await newPdf.save()
  onProgress?.(100, 'Done!')
  return bytes
}
