import * as XLSX from 'xlsx'

export interface SheetInfo {
  name: string
  rowCount: number
  columnCount: number
}

export interface ExcelInspectionResult {
  fileName: string
  sheetNames: string[]
  activeSheet: string
  sheets: SheetInfo[]
  previewRows: (string | number | boolean | null)[][]
  totalRows: number
  totalColumns: number
}

/**
 * Auto-detects delimiter in a CSV sample (comma, semicolon, tab, pipe).
 */
export function autoDetectDelimiter(sampleText: string): string {
  const lines = sampleText.split(/\r?\n/).filter((line) => line.trim().length > 0).slice(0, 5)
  if (lines.length === 0) return ','

  const candidates = [',', ';', '\t', '|']
  const counts: Record<string, number> = { ',': 0, ';': 0, '\t': 0, '|': 0 }

  for (const line of lines) {
    for (const c of candidates) {
      const match = line.split(c)
      if (match.length > 1) {
        counts[c] += match.length - 1
      }
    }
  }

  let bestDelimiter = ','
  let maxCount = -1
  for (const c of candidates) {
    if (counts[c] > maxCount) {
      maxCount = counts[c]
      bestDelimiter = c
    }
  }

  return maxCount > 0 ? bestDelimiter : ','
}

/**
 * Parses raw CSV/TSV text and exports a valid Excel .xlsx workbook Blob.
 */
export function csvToExcelBlob(
  csvText: string,
  options: {
    sheetName?: string
    delimiter?: string
  } = {}
): Blob {
  const clean = csvText.trim()
  if (!clean) {
    throw new Error('CSV data is empty. Please enter or upload valid CSV text.')
  }

  const delimiter = options.delimiter && options.delimiter !== 'auto'
    ? options.delimiter
    : autoDetectDelimiter(clean)

  // Parse lines with delimiter
  const lines = clean.split(/\r?\n/)
  const data: string[][] = []

  for (const line of lines) {
    if (!line.trim() && data.length > 0) continue
    // Parse respecting quotes
    const row: string[] = []
    let current = ''
    let insideQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          insideQuotes = !insideQuotes
        }
      } else if (char === delimiter && !insideQuotes) {
        row.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    row.push(current.trim())
    data.push(row)
  }

  if (data.length === 0) {
    throw new Error('No valid tabular rows could be parsed from CSV.')
  }

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet(data)
  const sheetName = (options.sheetName || 'Sheet1').substring(0, 31).replace(/[\\/?*[\]]/g, '') || 'Sheet1'

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  const excelBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  })

  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

/**
 * Inspects an uploaded Excel (.xlsx, .xls) workbook in the browser.
 */
export async function inspectExcelWorkbook(file: File): Promise<ExcelInspectionResult> {
  const buffer = await file.arrayBuffer()
  let workbook: XLSX.WorkBook

  try {
    workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  } catch (err: any) {
    throw new Error(`Failed to parse Excel workbook: ${err.message || 'File may be corrupted or password-protected.'}`)
  }

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('This Excel file contains no worksheets.')
  }

  const sheetNames = workbook.SheetNames
  const activeSheet = sheetNames[0]

  const sheets: SheetInfo[] = sheetNames.map((name) => {
    const ws = workbook.Sheets[name]
    const ref = ws['!ref']
    if (!ref) return { name, rowCount: 0, columnCount: 0 }
    const range = XLSX.utils.decode_range(ref)
    return {
      name,
      rowCount: range.e.r - range.s.r + 1,
      columnCount: range.e.c - range.s.c + 1,
    }
  })

  const firstWorksheet = workbook.Sheets[activeSheet]
  const previewData: (string | number | boolean | null)[][] = XLSX.utils.sheet_to_json(firstWorksheet, {
    header: 1,
    blankrows: false,
    defval: '',
  })

  const activeSheetInfo = sheets[0]

  return {
    fileName: file.name,
    sheetNames,
    activeSheet,
    sheets,
    previewRows: previewData.slice(0, 15),
    totalRows: activeSheetInfo.rowCount,
    totalColumns: activeSheetInfo.columnCount,
  }
}

/**
 * Converts a specific sheet of an Excel workbook to CSV text.
 */
export async function excelSheetToCsv(
  file: File,
  sheetName?: string,
  delimiter: string = ','
): Promise<{
  csv: string
  rowCount: number
  columnCount: number
  sheetNames: string[]
  selectedSheet: string
}> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })

  const sheetNames = workbook.SheetNames
  if (!sheetNames || sheetNames.length === 0) {
    throw new Error('Workbook contains no sheets.')
  }

  const selectedSheet = sheetName && sheetNames.includes(sheetName) ? sheetName : sheetNames[0]
  const worksheet = workbook.Sheets[selectedSheet]

  if (!worksheet) {
    throw new Error(`Sheet "${selectedSheet}" not found.`)
  }

  const csv = XLSX.utils.sheet_to_csv(worksheet, {
    FS: delimiter,
    blankrows: false,
  })

  const ref = worksheet['!ref']
  let rowCount = 0
  let columnCount = 0
  if (ref) {
    const range = XLSX.utils.decode_range(ref)
    rowCount = range.e.r - range.s.r + 1
    columnCount = range.e.c - range.s.c + 1
  }

  return {
    csv,
    rowCount,
    columnCount,
    sheetNames,
    selectedSheet,
  }
}

/**
 * Reconstructs tabular rows from text coordinates and generates an Excel .xlsx workbook.
 */
export function tabularDataToExcelBlob(
  rows: (string | number)[][],
  sheetName = 'Extracted Table'
): Blob {
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet(rows)
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31))

  const buffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  })

  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}
