import React, { useState, useMemo } from 'react'
import {
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  RefreshCw,
  Upload,
} from 'lucide-react'
import {
  csvToExcelBlob,
  inspectExcelWorkbook,
  excelSheetToCsv,
  autoDetectDelimiter,
  type ExcelInspectionResult,
} from '../../core/engine/document/spreadsheetEngine'
import { FileDropZone } from '../../components/upload/FileDropZone'
import { triggerFileDownload, formatBytes } from '../../services/file/fileUtils'

// ============================================================================
// 1. CSV TO EXCEL VIEW
// ============================================================================

export const CsvToExcelView: React.FC = () => {
  const [csvText, setCsvText] = useState(
    'Name,Department,Role,Salary\nAlice,Engineering,Lead Frontend,125000\nBob,Design,UI/UX Architect,110000\nCharlie,Product,VP Product,140000\nDana,Security,AppSec Engineer,130000'
  )
  const [delimiter, setDelimiter] = useState<string>('auto')
  const [sheetName, setSheetName] = useState('Sheet1')
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)

  const detectedDelimiter = useMemo(() => autoDetectDelimiter(csvText), [csvText])
  const activeDelimiter = delimiter === 'auto' ? detectedDelimiter : delimiter

  // Parse preview
  const previewRows = useMemo(() => {
    if (!csvText.trim()) return []
    const lines = csvText.trim().split(/\r?\n/).slice(0, 8)
    return lines.map((line) => line.split(activeDelimiter))
  }, [csvText, activeDelimiter])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCsvText(reader.result)
        setGeneratedBlob(null)
        setError(null)
      }
    }
    reader.readAsText(file)
  }

  const handleGenerate = () => {
    setError(null)
    try {
      const blob = csvToExcelBlob(csvText, {
        sheetName,
        delimiter: activeDelimiter,
      })
      setGeneratedBlob(blob)
    } catch (err: any) {
      setError(err.message || 'Failed to convert CSV to Excel.')
    }
  }

  const handleDownload = () => {
    if (!generatedBlob) return
    triggerFileDownload(generatedBlob, `${sheetName || 'spreadsheet'}.xlsx`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Fidelity Label Card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.85rem 1.25rem',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className="badge badge-green" style={{ fontWeight: 700 }}>
            [Basic Conversion]
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Maps delimiter-separated text rows into structured Microsoft Excel <code>.xlsx</code> workbook cells.
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Upload size={13} /> Upload CSV File
            <input type="file" accept=".csv,.tsv,.txt" style={{ display: 'none' }} onChange={handleFileUpload} />
          </label>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setCsvText(''); setGeneratedBlob(null); }}>
            Clear
          </button>
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          padding: '1.25rem',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            Delimiter:
          </label>
          <select
            className="search-input"
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value)}
          >
            <option value="auto">Auto-Detect ({activeDelimiter === '\t' ? 'Tab' : activeDelimiter})</option>
            <option value=",">Comma (,)</option>
            <option value=";">Semicolon (;)</option>
            <option value="&#9;">Tab (\t)</option>
            <option value="|">Pipe (|)</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            Worksheet Name:
          </label>
          <input
            type="text"
            className="search-input"
            value={sheetName}
            maxLength={31}
            onChange={(e) => setSheetName(e.target.value)}
            placeholder="Sheet1"
          />
        </div>
      </div>

      {/* Text Area */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
          CSV / Tabular Text Content:
        </label>
        <textarea
          className="search-input"
          style={{ height: '160px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
          value={csvText}
          onChange={(e) => {
            setCsvText(e.target.value)
            setGeneratedBlob(null)
          }}
          placeholder="col1,col2,col3..."
        />
      </div>

      {/* Live Table Preview */}
      {previewRows.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Data Grid Preview (First {previewRows.length} rows):
          </span>
          <div
            style={{
              overflowX: 'auto',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <tbody>
                {previewRows.map((row, rIdx) => (
                  <tr key={rIdx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        style={{
                          padding: '0.5rem 0.75rem',
                          fontFamily: rIdx === 0 ? 'inherit' : 'var(--font-mono)',
                          fontWeight: rIdx === 0 ? 600 : 400,
                          backgroundColor: rIdx === 0 ? 'var(--bg-secondary)' : 'transparent',
                          borderRight: '1px solid var(--border-subtle)',
                        }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--accent-rose)',
            color: 'var(--accent-rose)',
            fontSize: '0.85rem',
          }}
        >
          ❌ {error}
        </div>
      )}

      {/* Action / Download Section */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={!csvText.trim()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
        >
          <FileSpreadsheet size={15} /> Convert to Excel (.xlsx)
        </button>

        {generatedBlob && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleDownload}
            style={{ backgroundColor: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <Download size={15} /> Download {sheetName}.xlsx ({formatBytes(generatedBlob.size)})
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// 2. EXCEL TO CSV VIEW (WITH SHEET SELECTION & DELIMITER SELECTION)
// ============================================================================

export const ExcelToCsvView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [workbookInfo, setWorkbookInfo] = useState<ExcelInspectionResult | null>(null)
  const [selectedSheet, setSelectedSheet] = useState<string>('')
  const [delimiter, setDelimiter] = useState<string>(',')
  const [csvResult, setCsvResult] = useState<{
    csv: string
    rowCount: number
    columnCount: number
  } | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelected = async (files: File[]) => {
    const f = files[0]
    if (!f) return

    setFile(f)
    setError(null)
    setCsvResult(null)

    try {
      const info = await inspectExcelWorkbook(f)
      setWorkbookInfo(info)
      setSelectedSheet(info.activeSheet)

      // Convert active sheet by default
      const res = await excelSheetToCsv(f, info.activeSheet, delimiter)
      setCsvResult({
        csv: res.csv,
        rowCount: res.rowCount,
        columnCount: res.columnCount,
      })
    } catch (err: any) {
      setError(err.message || 'Failed to inspect Excel workbook.')
    }
  }

  const handleSheetChange = async (sheetName: string) => {
    setSelectedSheet(sheetName)
    if (!file) return

    try {
      const res = await excelSheetToCsv(file, sheetName, delimiter)
      setCsvResult({
        csv: res.csv,
        rowCount: res.rowCount,
        columnCount: res.columnCount,
      })
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDelimiterChange = async (delim: string) => {
    setDelimiter(delim)
    if (!file || !selectedSheet) return

    try {
      const res = await excelSheetToCsv(file, selectedSheet, delim)
      setCsvResult({
        csv: res.csv,
        rowCount: res.rowCount,
        columnCount: res.columnCount,
      })
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleCopy = () => {
    if (!csvResult) return
    navigator.clipboard.writeText(csvResult.csv)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!csvResult || !file) return
    const blob = new Blob([csvResult.csv], { type: 'text/csv;charset=utf-8' })
    const baseName = file.name.replace(/\.[^/.]+$/, '')
    triggerFileDownload(blob, `${baseName}_${selectedSheet}.csv`)
  }

  const handleReset = () => {
    setFile(null)
    setWorkbookInfo(null)
    setCsvResult(null)
    setError(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Fidelity Label Card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.85rem 1.25rem',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <span className="badge badge-green" style={{ fontWeight: 700 }}>
          [Basic Conversion]
        </span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Extracts worksheet cell data from Excel spreadsheets (<code>.xlsx</code> / <code>.xls</code>) into standard UTF-8 CSV text.
        </span>
      </div>

      {!file ? (
        <FileDropZone
          acceptedTypes={['.xlsx', '.xls', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']}
          onFilesSelected={handleFileSelected}
          title="Drop an Excel (.xlsx or .xls) file to convert sheets to CSV"
          supportsMultipleFiles={false}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              padding: '1.25rem',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileSpreadsheet size={20} color="var(--accent-primary)" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                  {file.name}
                </h3>
              </div>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {formatBytes(file.size)} • {workbookInfo?.sheetNames.length} sheet{workbookInfo?.sheetNames.length === 1 ? '' : 's'} available
              </p>
            </div>

            <button type="button" className="btn btn-secondary btn-sm" onClick={handleReset}>
              <RefreshCw size={14} /> Open Different Spreadsheet
            </button>
          </div>

          {/* Configuration Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              padding: '1.25rem',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {/* Sheet Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Select Sheet to Convert:
              </label>
              <select
                className="search-input"
                value={selectedSheet}
                onChange={(e) => handleSheetChange(e.target.value)}
              >
                {workbookInfo?.sheets.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name} ({s.rowCount} rows × {s.columnCount} cols)
                  </option>
                ))}
              </select>
            </div>

            {/* Output Delimiter */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Output Delimiter:
              </label>
              <select
                className="search-input"
                value={delimiter}
                onChange={(e) => handleDelimiterChange(e.target.value)}
              >
                <option value=",">Comma (,)</option>
                <option value=";">Semicolon (;)</option>
                <option value="&#9;">Tab (\t - TSV)</option>
                <option value="|">Pipe (|)</option>
              </select>
            </div>
          </div>

          {/* Preview Output */}
          {csvResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Generated CSV Text ({csvResult.rowCount} rows, {csvResult.columnCount} columns):
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleCopy}>
                    {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy CSV'}
                  </button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={handleDownload}>
                    <Download size={14} /> Download .csv
                  </button>
                </div>
              </div>

              <textarea
                readOnly
                className="search-input"
                style={{ height: '260px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', lineHeight: 1.5 }}
                value={csvResult.csv}
              />
            </div>
          )}

          {error && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--accent-rose)',
                color: 'var(--accent-rose)',
                fontSize: '0.85rem',
              }}
            >
              ❌ {error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
