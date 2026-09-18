import { marked } from 'marked'
import DOMPurify from 'dompurify'
import * as Diff from 'diff'

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
    .replace(/<br\s*[\/]?>/gi, '\n')
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

/**
 * Formats or minifies JSON string with syntax error detection.
 */
export function processJson(
  input: string,
  mode: 'format' | 'minify',
  indentSize: number = 2
): { output: string; isValid: boolean; error?: string } {
  try {
    const parsed = JSON.parse(input)
    if (mode === 'format') {
      return { output: JSON.stringify(parsed, null, indentSize), isValid: true }
    } else {
      return { output: JSON.stringify(parsed), isValid: true }
    }
  } catch (err: any) {
    return { output: input, isValid: false, error: err.message }
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
