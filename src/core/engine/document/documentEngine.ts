import { marked } from 'marked'
import DOMPurify from 'dompurify'
import * as Diff from 'diff'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import JSZip from 'jszip'
import { extractPdfTextContent } from '../pdf/pdfEngine'

/**
 * Parses Markdown into sanitized HTML using marked and DOMPurify.
 */
export function parseMarkdown(markdown: string): string {
  const rawHtml = marked.parse(markdown) as string
  return DOMPurify.sanitize(rawHtml)
}

/**
 * Converts basic HTML structure to Markdown.
 */
export function htmlToMarkdown(html: string): string {
  let md = html
    // Headings
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    // Bold / Strong
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    // Italic / Em
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    // Links
    .replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    // Code blocks & inline code
    .replace(/<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```\n\n')
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    // Paragraphs & Line breaks
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    // Unordered lists
    .replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, '$1\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    // Strip remaining tags
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

  return md.trim()
}

/**
 * Computes word, character, paragraph, sentence count, and reading time.
 */
export function analyzeText(text: string) {
  const charactersWithSpaces = text.length
  const charactersNoSpaces = text.replace(/\s/g, '').length
  const wordsArray = text.trim() ? text.trim().split(/\s+/) : []
  const words = text.trim() ? wordsArray.length : 0
  const paragraphs = text.trim() ? text.split(/\n+/).filter((p) => p.trim().length > 0).length : 0
  const sentences = text.trim() ? text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length : 0

  // Reading time at average 200 words per minute
  const readingTimeMinutes = Math.ceil(words / 200)
  // Speaking time at average 130 words per minute
  const speakingTimeMinutes = Math.ceil(words / 130)

  return {
    charactersWithSpaces,
    charactersNoSpaces,
    words,
    paragraphs,
    sentences,
    readingTimeMinutes,
    speakingTimeMinutes,
  }
}

/**
 * Computes difference between two texts (line-by-line or word-by-word).
 */
export function computeTextDiff(
  oldText: string,
  newText: string,
  mode: 'lines' | 'words' = 'lines'
): Diff.Change[] {
  if (mode === 'words') {
    return Diff.diffWords(oldText, newText)
  }
  return Diff.diffLines(oldText, newText)
}

/**
 * Converts text into different casing conventions.
 */
export function convertCase(
  text: string,
  targetCase: 'uppercase' | 'lowercase' | 'titlecase' | 'camelcase' | 'snakecase' | 'kebabcase'
): string {
  switch (targetCase) {
    case 'uppercase':
      return text.toUpperCase()
    case 'lowercase':
      return text.toLowerCase()
    case 'titlecase':
      return text.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.substring(1).toLowerCase())
    case 'camelcase': {
      const words = text.replace(/[^a-zA-Z0-9]/g, ' ').trim().split(/\s+/)
      return words
        .map((w, idx) =>
          idx === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        )
        .join('')
    }
    case 'snakecase':
      return text
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[^a-zA-Z0-9]/g, ' ')
        .trim()
        .split(/\s+/)
        .join('_')
        .toLowerCase()
    case 'kebabcase':
      return text
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[^a-zA-Z0-9]/g, ' ')
        .trim()
        .split(/\s+/)
        .join('-')
        .toLowerCase()
  }
}

// ============================================================================
// ENHANCED JSON FORMATTER & MINIFIER WITH DIAGNOSTIC ERRORS
// ============================================================================

export interface JsonSyntaxErrorDetail {
  message: string
  line?: number
  column?: number
  snippet?: string
  position?: number
}

/**
 * Diagnoses a JSON syntax error by extracting line, column, and code excerpt.
 */
export function diagnoseJsonError(input: string, err: Error): JsonSyntaxErrorDetail {
  const msg = err.message || 'Invalid JSON syntax'
  let line = 1
  let column = 1
  let position: number | undefined

  // 1. Try matching "at position <num>"
  const posMatch = msg.match(/at position (\d+)/i)
  if (posMatch) {
    position = parseInt(posMatch[1], 10)
  }

  // 2. Try matching "line <num> column <num>"
  const lineColMatch = msg.match(/line (\d+) column (\d+)/i)
  if (lineColMatch) {
    line = parseInt(lineColMatch[1], 10)
    column = parseInt(lineColMatch[2], 10)
  } else if (position !== undefined && position >= 0) {
    // Derive line and column from character position
    const textUpToPos = input.substring(0, Math.min(position, input.length))
    const lines = textUpToPos.split('\n')
    line = lines.length
    column = lines[lines.length - 1].length + 1
  }

  // 3. Create a helpful visual snippet if line is known
  let snippet: string | undefined
  const allLines = input.split('\n')
  if (line > 0 && line <= allLines.length) {
    const errorLine = allLines[line - 1]
    const pointer = ' '.repeat(Math.max(0, column - 1)) + '^'
    snippet = `Line ${line}: ${errorLine}\n        ${pointer}`
  }

  return {
    message: msg,
    line,
    column,
    snippet,
    position,
  }
}

/**
 * Recursively sorts the keys of an object alphabetically.
 */
function sortObjectKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys)
  }
  if (obj !== null && typeof obj === 'object') {
    const sortedObj: Record<string, any> = {}
    const keys = Object.keys(obj).sort()
    for (const key of keys) {
      sortedObj[key] = sortObjectKeys(obj[key])
    }
    return sortedObj
  }
  return obj
}

export interface JsonFormatOptions {
  indent?: 2 | 4 | '\t' | 1
  sortKeys?: boolean
}

/**
 * Formats JSON with customizable indentation and key sorting.
 */
export function formatJson(
  input: string,
  options: JsonFormatOptions = {}
): {
  output: string
  isValid: boolean
  error?: JsonSyntaxErrorDetail
  parsed?: any
} {
  const clean = input.trim()
  if (!clean) {
    return { output: '', isValid: true }
  }

  try {
    let parsed = JSON.parse(clean)
    if (options.sortKeys) {
      parsed = sortObjectKeys(parsed)
    }
    const indent = options.indent ?? 2
    const output = JSON.stringify(parsed, null, indent)
    return { output, isValid: true, parsed }
  } catch (err: any) {
    const error = diagnoseJsonError(input, err)
    return { output: input, isValid: false, error }
  }
}

export interface JsonMinifyResult {
  output: string
  isValid: boolean
  error?: JsonSyntaxErrorDetail
  originalBytes: number
  minifiedBytes: number
  bytesSaved: number
  savingsPercentage: number
}

/**
 * Minifies JSON by removing all unnecessary whitespace while strictly validating structure.
 */
export function minifyJson(input: string): JsonMinifyResult {
  const clean = input.trim()
  const originalBytes = new TextEncoder().encode(input).byteLength

  if (!clean) {
    return {
      output: '',
      isValid: true,
      originalBytes: 0,
      minifiedBytes: 0,
      bytesSaved: 0,
      savingsPercentage: 0,
    }
  }

  try {
    const parsed = JSON.parse(clean)
    const output = JSON.stringify(parsed)
    const minifiedBytes = new TextEncoder().encode(output).byteLength
    const bytesSaved = Math.max(0, originalBytes - minifiedBytes)
    const savingsPercentage = originalBytes > 0 ? parseFloat(((bytesSaved / originalBytes) * 100).toFixed(1)) : 0

    return {
      output,
      isValid: true,
      originalBytes,
      minifiedBytes,
      bytesSaved,
      savingsPercentage,
    }
  } catch (err: any) {
    const error = diagnoseJsonError(input, err)
    return {
      output: input,
      isValid: false,
      error,
      originalBytes,
      minifiedBytes: originalBytes,
      bytesSaved: 0,
      savingsPercentage: 0,
    }
  }
}

/**
 * Backward-compatible helper for existing code.
 */
export function processJson(
  input: string,
  mode: 'format' | 'minify',
  indentSize: number = 2
): { output: string; isValid: boolean; error?: string } {
  if (mode === 'format') {
    const res = formatJson(input, { indent: (indentSize as any) || 2 })
    return {
      output: res.output,
      isValid: res.isValid,
      error: res.error?.message,
    }
  } else {
    const res = minifyJson(input)
    return {
      output: res.output,
      isValid: res.isValid,
      error: res.error?.message,
    }
  }
}

// ============================================================================
// TEXT FILE CONVERTER ENGINE
// ============================================================================

export type TextConversionType =
  | 'crlf-to-lf'
  | 'lf-to-crlf'
  | 'to-cr'
  | 'tabs-to-spaces-2'
  | 'tabs-to-spaces-4'
  | 'spaces-to-tabs-2'
  | 'spaces-to-tabs-4'
  | 'text-to-hex'
  | 'hex-to-text'
  | 'text-to-binary'
  | 'binary-to-text'
  | 'html-encode'
  | 'html-decode'
  | 'uppercase'
  | 'lowercase'
  | 'titlecase'

export interface TextConversionStats {
  inputChars: number
  outputChars: number
  inputLines: number
  outputLines: number
  inputWords: number
  outputWords: number
  inputBytes: number
  outputBytes: number
}

/**
 * Performs various text transformations (line endings, encodings, tabs/spaces, HTML entities).
 */
export function convertText(
  input: string,
  type: TextConversionType
): { output: string; stats: TextConversionStats; error?: string } {
  const encoder = new TextEncoder()
  const inputBytes = encoder.encode(input).byteLength
  const inputChars = input.length
  const inputLines = input ? input.split(/\r\n|\r|\n/).length : 0
  const inputWords = input.trim() ? input.trim().split(/\s+/).length : 0

  let output = input
  let error: string | undefined

  try {
    switch (type) {
      // 1. Line Endings
      case 'crlf-to-lf':
        output = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
        break
      case 'lf-to-crlf':
        // Normalize to LF first then to CRLF
        output = input.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n/g, '\r\n')
        break
      case 'to-cr':
        output = input.replace(/\r\n/g, '\r').replace(/\n/g, '\r')
        break

      // 2. Tabs & Spaces
      case 'tabs-to-spaces-2':
        output = input.replace(/\t/g, '  ')
        break
      case 'tabs-to-spaces-4':
        output = input.replace(/\t/g, '    ')
        break
      case 'spaces-to-tabs-2':
        output = input.replace(/  /g, '\t')
        break
      case 'spaces-to-tabs-4':
        output = input.replace(/    /g, '\t')
        break

      // 3. Hexadecimal
      case 'text-to-hex': {
        const bytes = encoder.encode(input)
        const hexArr: string[] = []
        for (let i = 0; i < bytes.length; i++) {
          hexArr.push(bytes[i].toString(16).padStart(2, '0').toUpperCase())
        }
        output = hexArr.join(' ')
        break
      }
      case 'hex-to-text': {
        const cleanHex = input.replace(/[^0-9a-fA-F]/g, '')
        if (cleanHex.length % 2 !== 0) {
          throw new Error('Invalid Hex string: odd number of hexadecimal characters.')
        }
        const bytes = new Uint8Array(cleanHex.length / 2)
        for (let i = 0; i < cleanHex.length; i += 2) {
          bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16)
        }
        output = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
        break
      }

      // 4. Binary (0s and 1s)
      case 'text-to-binary': {
        const bytes = encoder.encode(input)
        const binArr: string[] = []
        for (let i = 0; i < bytes.length; i++) {
          binArr.push(bytes[i].toString(2).padStart(8, '0'))
        }
        output = binArr.join(' ')
        break
      }
      case 'binary-to-text': {
        const cleanBin = input.trim().split(/\s+/)
        const bytes = new Uint8Array(cleanBin.length)
        for (let i = 0; i < cleanBin.length; i++) {
          const b = cleanBin[i]
          if (!/^[01]{1,8}$/.test(b)) {
            throw new Error(`Invalid binary sequence: "${b}" is not an 8-bit binary byte.`)
          }
          bytes[i] = parseInt(b, 2)
        }
        output = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
        break
      }

      // 5. HTML Entities
      case 'html-encode':
        output = input
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')
        break
      case 'html-decode':
        output = input
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
        break

      // 6. Casing
      case 'uppercase':
        output = input.toUpperCase()
        break
      case 'lowercase':
        output = input.toLowerCase()
        break
      case 'titlecase':
        output = input.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.substring(1).toLowerCase())
        break
    }
  } catch (err: any) {
    error = err.message || 'Conversion error'
    output = input
  }

  const outputBytes = encoder.encode(output).byteLength
  const outputChars = output.length
  const outputLines = output ? output.split(/\r\n|\r|\n/).length : 0
  const outputWords = output.trim() ? output.trim().split(/\s+/).length : 0

  return {
    output,
    stats: {
      inputChars,
      outputChars,
      inputLines,
      outputLines,
      inputWords,
      outputWords,
      inputBytes,
      outputBytes,
    },
    error,
  }
}

/**
 * Converts CSV string to JSON array.
 */
export function csvToJson(csv: string, delimiter: string = ','): string {
  const lines = csv.trim().split(/\r?\n/)
  if (lines.length < 2) return '[]'

  const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^"(.*)"$/, '$1'))
  const result: any[] = []

  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i].split(delimiter).map((v) => v.trim().replace(/^"(.*)"$/, '$1'))
    if (currentLine.length === headers.length) {
      const obj: Record<string, string> = {}
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = currentLine[j]
      }
      result.push(obj)
    }
  }

  return JSON.stringify(result, null, 2)
}

/**
 * Converts JSON array to CSV string.
 */
export function jsonToCsv(jsonStr: string, delimiter: string = ','): string {
  const parsed = JSON.parse(jsonStr)
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Input must be a non-empty array of objects.')
  }

  const headers = Object.keys(parsed[0])
  const rows = [headers.join(delimiter)]

  for (const item of parsed) {
    const values = headers.map((header) => {
      const val = item[header] !== undefined ? String(item[header]) : ''
      return val.includes(delimiter) || val.includes('"') || val.includes('\n')
        ? `"${val.replace(/"/g, '""')}"`
        : val
    })
    rows.push(values.join(delimiter))
  }

  return rows.join('\n')
}

// ============================================================================
// PDF, MARKDOWN, AND WORD DOCUMENT CONVERSION ENGINES
// ============================================================================

export interface TextToPdfOptions {
  fontSize?: number
  margins?: number
  lineHeight?: number
  orientation?: 'portrait' | 'landscape'
  includePageNumbers?: boolean
}

/**
 * Converts raw plain text into a valid multi-page vector PDF document.
 */
export async function textToPdf(
  text: string,
  options: TextToPdfOptions = {}
): Promise<Blob> {
  const clean = text.trim()
  if (!clean) {
    throw new Error('Please enter or upload some text to generate a PDF.')
  }

  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontSize = options.fontSize || 12
  const margins = options.margins || 50
  const lineHeight = (options.lineHeight || 1.35) * fontSize
  const isLandscape = options.orientation === 'landscape'

  // Letter: 612 x 792 pt
  const pageWidth = isLandscape ? 792 : 612
  const pageHeight = isLandscape ? 612 : 792
  const usableWidth = pageWidth - margins * 2
  const usableHeight = pageHeight - margins * 2 - (options.includePageNumbers !== false ? 30 : 0)

  // Split input into paragraphs and wrap into lines
  const paragraphs = clean.split(/\r?\n/)
  const wrappedLines: string[] = []

  for (const p of paragraphs) {
    if (!p.trim()) {
      wrappedLines.push('')
      continue
    }

    const words = p.split(/\s+/)
    let currentLine = ''

    for (const w of words) {
      const testLine = currentLine ? `${currentLine} ${w}` : w
      const width = font.widthOfTextAtSize(testLine, fontSize)
      if (width < usableWidth) {
        currentLine = testLine
      } else {
        if (currentLine) wrappedLines.push(currentLine)
        currentLine = w
      }
    }
    if (currentLine) wrappedLines.push(currentLine)
  }

  // Draw lines across pages
  const linesPerPage = Math.floor(usableHeight / lineHeight)
  const totalPages = Math.max(1, Math.ceil(wrappedLines.length / linesPerPage))

  for (let pIdx = 0; pIdx < totalPages; pIdx++) {
    const page = pdfDoc.addPage([pageWidth, pageHeight])
    const startLine = pIdx * linesPerPage
    const endLine = Math.min(wrappedLines.length, startLine + linesPerPage)

    let yPos = pageHeight - margins - fontSize
    for (let l = startLine; l < endLine; l++) {
      const lineText = wrappedLines[l]
      if (lineText) {
        page.drawText(lineText, {
          x: margins,
          y: yPos,
          size: fontSize,
          font,
          color: rgb(0.1, 0.1, 0.1),
        })
      }
      yPos -= lineHeight
    }

    // Page number footer
    if (options.includePageNumbers !== false) {
      const footerText = `Page ${pIdx + 1} of ${totalPages}`
      const footerWidth = font.widthOfTextAtSize(footerText, 9)
      page.drawText(footerText, {
        x: pageWidth / 2 - footerWidth / 2,
        y: margins / 2,
        size: 9,
        font,
        color: rgb(0.5, 0.5, 0.5),
      })
    }
  }

  const pdfBytes = await pdfDoc.save()
  const arrayBuffer = pdfBytes.buffer.slice(
    pdfBytes.byteOffset,
    pdfBytes.byteOffset + pdfBytes.byteLength
  ) as ArrayBuffer
  return new Blob([arrayBuffer], { type: 'application/pdf' })
}

export interface MarkdownToPdfOptions {
  paperSize?: 'a4' | 'letter'
  margins?: number
}

/**
 * Converts Markdown text into a styled multi-page vector PDF.
 */
export async function markdownToPdf(
  markdown: string,
  options: MarkdownToPdfOptions = {}
): Promise<Blob> {
  const clean = markdown.trim()
  if (!clean) {
    throw new Error('Please enter some markdown to generate a PDF.')
  }

  const pdfDoc = await PDFDocument.create()
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const monoFont = await pdfDoc.embedFont(StandardFonts.Courier)

  const isA4 = options.paperSize !== 'letter'
  const pageWidth = isA4 ? 595.28 : 612
  const pageHeight = isA4 ? 841.89 : 792
  const margins = options.margins || 50
  const usableWidth = pageWidth - margins * 2

  const lines = clean.split(/\r?\n/)
  let currentPage = pdfDoc.addPage([pageWidth, pageHeight])
  let yPos = pageHeight - margins - 15

  const ensureSpace = (neededHeight: number) => {
    if (yPos - neededHeight < margins + 20) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight])
      yPos = pageHeight - margins - 15
    }
  }

  let inCodeBlock = false

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]

    // Code block delimiters
    if (rawLine.startsWith('```')) {
      inCodeBlock = !inCodeBlock
      yPos -= 6
      continue
    }

    if (inCodeBlock) {
      ensureSpace(16)
      currentPage.drawRectangle({
        x: margins - 4,
        y: yPos - 3,
        width: usableWidth + 8,
        height: 14,
        color: rgb(0.95, 0.95, 0.95),
      })
      currentPage.drawText(rawLine.substring(0, 80), {
        x: margins,
        y: yPos,
        size: 9,
        font: monoFont,
        color: rgb(0.15, 0.15, 0.15),
      })
      yPos -= 14
      continue
    }

    // Headings
    if (rawLine.startsWith('# ')) {
      ensureSpace(32)
      yPos -= 8
      const title = rawLine.replace(/^#\s+/, '')
      currentPage.drawText(title, {
        x: margins,
        y: yPos,
        size: 18,
        font: boldFont,
        color: rgb(0.05, 0.05, 0.15),
      })
      yPos -= 24
      continue
    } else if (rawLine.startsWith('## ')) {
      ensureSpace(26)
      yPos -= 6
      const title = rawLine.replace(/^##\s+/, '')
      currentPage.drawText(title, {
        x: margins,
        y: yPos,
        size: 14,
        font: boldFont,
        color: rgb(0.1, 0.15, 0.2),
      })
      yPos -= 18
      continue
    } else if (rawLine.startsWith('### ')) {
      ensureSpace(22)
      yPos -= 4
      const title = rawLine.replace(/^###\s+/, '')
      currentPage.drawText(title, {
        x: margins,
        y: yPos,
        size: 12,
        font: boldFont,
        color: rgb(0.15, 0.2, 0.25),
      })
      yPos -= 16
      continue
    }

    // Bullet items
    if (/^[-*+]\s+/.test(rawLine)) {
      ensureSpace(16)
      const bulletText = rawLine.replace(/^[-*+]\s+/, '')
      currentPage.drawCircle({
        x: margins + 4,
        y: yPos + 3,
        size: 2,
        color: rgb(0.2, 0.2, 0.2),
      })
      currentPage.drawText(bulletText.replace(/[*_`]/g, ''), {
        x: margins + 14,
        y: yPos,
        size: 10,
        font: regularFont,
        color: rgb(0.15, 0.15, 0.15),
      })
      yPos -= 16
      continue
    }

    // Empty line
    if (!rawLine.trim()) {
      yPos -= 10
      continue
    }

    // Standard paragraph line wrapping
    const words = rawLine.replace(/[*_`]/g, '').split(/\s+/)
    let currentLine = ''

    for (const w of words) {
      const test = currentLine ? `${currentLine} ${w}` : w
      const wWidth = regularFont.widthOfTextAtSize(test, 10)
      if (wWidth < usableWidth) {
        currentLine = test
      } else {
        ensureSpace(14)
        if (currentLine) {
          currentPage.drawText(currentLine, {
            x: margins,
            y: yPos,
            size: 10,
            font: regularFont,
            color: rgb(0.15, 0.15, 0.15),
          })
          yPos -= 14
        }
        currentLine = w
      }
    }

    if (currentLine) {
      ensureSpace(14)
      currentPage.drawText(currentLine, {
        x: margins,
        y: yPos,
        size: 10,
        font: regularFont,
        color: rgb(0.15, 0.15, 0.15),
      })
      yPos -= 14
    }
  }

  const pdfBytes = await pdfDoc.save()
  const arrayBuffer = pdfBytes.buffer.slice(
    pdfBytes.byteOffset,
    pdfBytes.byteOffset + pdfBytes.byteLength
  ) as ArrayBuffer
  return new Blob([arrayBuffer], { type: 'application/pdf' })
}

/**
 * Packages plain text into a valid Microsoft Word .docx (Office OpenXML) file.
 */
export async function textToDocxBlob(text: string, title?: string): Promise<Blob> {
  const zip = new JSZip()

  // 1. [Content_Types].xml
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  )

  // 2. _rels/.rels
  zip.folder('_rels')?.file(
    '.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  )

  // 3. Format document paragraphs
  const escapeXml = (unsafe: string) =>
    unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')

  const paragraphs = text.split(/\r?\n/)
  let paragraphsXml = ''

  if (title) {
    paragraphsXml += `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
        <w:b/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="36"/>
        </w:rPr>
        <w:t>${escapeXml(title)}</w:t>
      </w:r>
    </w:p>`
  }

  for (const p of paragraphs) {
    if (!p.trim()) {
      paragraphsXml += '<w:p/>\n'
    } else {
      paragraphsXml += `
    <w:p>
      <w:r>
        <w:t xml:space="preserve">${escapeXml(p)}</w:t>
      </w:r>
    </w:p>\n`
    }
  }

  // 4. word/document.xml
  zip.folder('word')?.file(
    'document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphsXml}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`
  )

  const content = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })

  return content
}

/**
 * Extracts selectable text from a PDF and packages it into a valid Microsoft Word .docx file.
 */
export async function pdfToDocx(
  file: File,
  onProgress?: (progress: number, status: string) => void
): Promise<Blob> {
  onProgress?.(10, 'Extracting digital text from PDF document...')
  const result = await extractPdfTextContent(file, (p, s) => {
    onProgress?.(10 + Math.round((p / 100) * 60), s)
  })

  if (!result.text.trim()) {
    throw new Error('No selectable digital text found in this PDF. Scanned images without OCR cannot be reflowed.')
  }

  onProgress?.(75, 'Packaging extracted text into Microsoft Word (.docx) OpenXML structure...')
  const docxBlob = await textToDocxBlob(
    result.text,
    file.name.replace(/\.[^/.]+$/, '')
  )

  onProgress?.(100, 'Word document generated successfully!')
  return docxBlob
}

/**
 * Unpacks a Word .docx file, parses paragraphs and tables, and renders into a clean vector PDF.
 */
export async function docxToPdf(
  file: File,
  onProgress?: (progress: number, status: string) => void
): Promise<Blob> {
  onProgress?.(10, 'Unpacking Word (.docx) archive...')
  const zip = new JSZip()
  const arrayBuffer = await file.arrayBuffer()
  const loadedZip = await zip.loadAsync(arrayBuffer)

  const docXmlFile = loadedZip.file('word/document.xml')
  if (!docXmlFile) {
    throw new Error('Invalid .docx file: word/document.xml was not found in archive.')
  }

  onProgress?.(30, 'Parsing Office OpenXML structure and typography...')
  const xmlString = await docXmlFile.async('string')
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml')

  // Extract paragraphs (<w:p>)
  const pNodes = xmlDoc.getElementsByTagName('w:p')
  const extractedLines: { text: string; isHeading: boolean; isBold: boolean }[] = []

  for (let i = 0; i < pNodes.length; i++) {
    const p = pNodes[i]
    let pText = ''
    let isHeading = false
    let isBold = false

    // Check heading style
    const pStyle = p.getElementsByTagName('w:pStyle')[0]
    if (pStyle) {
      const val = pStyle.getAttribute('w:val') || ''
      if (/heading/i.test(val)) isHeading = true
    }

    // Read runs
    const rNodes = p.getElementsByTagName('w:r')
    for (let j = 0; j < rNodes.length; j++) {
      const r = rNodes[j]
      const t = r.getElementsByTagName('w:t')[0]
      if (t && t.textContent) {
        pText += t.textContent
      }
      if (r.getElementsByTagName('w:b').length > 0) {
        isBold = true
      }
    }

    if (pText.trim()) {
      extractedLines.push({ text: pText.trim(), isHeading, isBold })
    }
  }

  if (extractedLines.length === 0) {
    throw new Error('No readable text paragraphs found in Word document.')
  }

  onProgress?.(60, 'Composing vector PDF pages...')
  const pdfDoc = await PDFDocument.create()
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const pageWidth = 612
  const pageHeight = 792
  const margins = 54
  const usableWidth = pageWidth - margins * 2

  let page = pdfDoc.addPage([pageWidth, pageHeight])
  let yPos = pageHeight - margins - 15

  const ensureSpace = (h: number) => {
    if (yPos - h < margins + 20) {
      page = pdfDoc.addPage([pageWidth, pageHeight])
      yPos = pageHeight - margins - 15
    }
  }

  for (const line of extractedLines) {
    const font = line.isHeading || line.isBold ? boldFont : regularFont
    const fontSize = line.isHeading ? 14 : 11
    const lineHeight = fontSize * 1.35

    const words = line.text.split(/\s+/)
    let currentLine = ''

    for (const w of words) {
      const test = currentLine ? `${currentLine} ${w}` : w
      const width = font.widthOfTextAtSize(test, fontSize)
      if (width < usableWidth) {
        currentLine = test
      } else {
        ensureSpace(lineHeight)
        if (currentLine) {
          page.drawText(currentLine, {
            x: margins,
            y: yPos,
            size: fontSize,
            font,
            color: line.isHeading ? rgb(0.1, 0.15, 0.2) : rgb(0.15, 0.15, 0.15),
          })
          yPos -= lineHeight
        }
        currentLine = w
      }
    }

    if (currentLine) {
      ensureSpace(lineHeight)
      page.drawText(currentLine, {
        x: margins,
        y: yPos,
        size: fontSize,
        font,
        color: line.isHeading ? rgb(0.1, 0.15, 0.2) : rgb(0.15, 0.15, 0.15),
      })
      yPos -= lineHeight + 4
    }
  }

  onProgress?.(90, 'Finalizing PDF document...')
  const pdfBytes = await pdfDoc.save()
  const arrayBufferOut = pdfBytes.buffer.slice(
    pdfBytes.byteOffset,
    pdfBytes.byteOffset + pdfBytes.byteLength
  ) as ArrayBuffer

  onProgress?.(100, 'Word to PDF conversion complete!')
  return new Blob([arrayBufferOut], { type: 'application/pdf' })
}
