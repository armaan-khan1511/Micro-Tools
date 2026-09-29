import React, { useState, useMemo } from 'react'
import {
  parseMarkdown,
  analyzeText,
  computeTextDiff,
  convertCase,
  formatJson,
  minifyJson,
  convertText,
  textToPdf,
  markdownToPdf,
  docxToPdf,
  type TextConversionType,
} from '../../core/engine/document/documentEngine'
import {
  Copy,
  Check,
  AlertCircle,
  Download,
  Upload,
  Sparkles,
  FileText,
  Eye,
  Code,
  RefreshCw,
} from 'lucide-react'
import { triggerFileDownload, formatBytes } from '../../services/file/fileUtils'
import { FileDropZone } from '../../components/upload/FileDropZone'
import { ProgressBar } from '../../components/common/ProgressBar'


// ============================================================================
// 1. MARKDOWN PREVIEW & EDITOR
// ============================================================================

export const MarkdownPreviewView: React.FC = () => {
  const [markdown, setMarkdown] = useState(
    `# Markdown Live Preview\n\nThis markdown is parsed **100% locally** in your browser using \`marked\` and sanitized with \`DOMPurify\`.\n\n### Features\n- Instant live rendering\n- Zero server round-trips\n- Clean HTML export\n\n\`\`\`javascript\nconsole.log("Hello, private world!");\n\`\`\``
  )
  const [copied, setCopied] = useState(false)

  const htmlOutput = useMemo(() => parseMarkdown(markdown), [markdown])

  const copyHtml = () => {
    navigator.clipboard.writeText(htmlOutput)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={copyHtml}>
          {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
          {copied ? 'HTML Copied!' : 'Copy HTML Output'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
            Markdown Input:
          </label>
          <textarea
            className="search-input"
            style={{ height: '380px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', lineHeight: 1.5 }}
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
            Sanitized HTML Preview:
          </label>
          <div
            className="search-input"
            style={{
              height: '380px',
              overflowY: 'auto',
              backgroundColor: 'var(--bg-surface)',
              lineHeight: 1.6,
              fontSize: '0.9rem',
            }}
            dangerouslySetInnerHTML={{ __html: htmlOutput }}
          />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 2. WORD & READING TIME COUNTER
// ============================================================================

export const WordCounterView: React.FC = () => {
  const [text, setText] = useState('')

  const stats = useMemo(() => analyzeText(text), [text])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
        {[
          { label: 'Words', val: stats.words },
          { label: 'Characters', val: stats.charactersWithSpaces },
          { label: 'Chars (no space)', val: stats.charactersNoSpaces },
          { label: 'Sentences', val: stats.sentences },
          { label: 'Paragraphs', val: stats.paragraphs },
          { label: 'Reading Time', val: `${stats.readingTimeMinutes} min` },
        ].map((item, idx) => (
          <div
            key={idx}
            style={{
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
              {item.val}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

      <div>
        <textarea
          className="search-input"
          placeholder="Paste or type text to analyze in real time..."
          style={{ height: '280px', lineHeight: 1.6 }}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
    </div>
  )
}

// ============================================================================
// 3. TEXT DIFF & COMPARISON
// ============================================================================

export const TextDiffView: React.FC = () => {
  const [original, setOriginal] = useState('First line of text\nSecond unchanged line\nThird deleted line')
  const [modified, setModified] = useState('First line of text\nSecond unchanged line\nThird modified line\nFourth added line')
  const [mode, setMode] = useState<'lines' | 'words'>('lines')

  const diffChunks = useMemo(() => computeTextDiff(original, modified, mode), [original, modified, mode])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className={`btn ${mode === 'lines' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMode('lines')}
          >
            Line Diff
          </button>
          <button
            type="button"
            className={`btn ${mode === 'words' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMode('words')}
          >
            Word Diff
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            Original Text:
          </label>
          <textarea
            className="search-input"
            style={{ height: '180px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
            value={original}
            onChange={(e) => setOriginal(e.target.value)}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            Modified Text:
          </label>
          <textarea
            className="search-input"
            style={{ height: '180px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
            value={modified}
            onChange={(e) => setModified(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
          Visual Comparison Output:
        </label>
        <div
          style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            lineHeight: 1.6,
            minHeight: '120px',
            whiteSpace: 'pre-wrap',
          }}
        >
          {diffChunks.map((part: { added?: boolean; removed?: boolean; value: string }, index: number) => {
            const color = part.added ? '#34d399' : part.removed ? '#f43f5e' : 'inherit'
            const bg = part.added
              ? 'rgba(16, 185, 129, 0.15)'
              : part.removed
              ? 'rgba(244, 63, 94, 0.15)'
              : 'transparent'
            const textDecoration = part.removed ? 'line-through' : 'none'

            return (
              <span key={index} style={{ color, backgroundColor: bg, textDecoration, padding: '0 2px' }}>
                {part.value}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 4. JSON FORMATTER & VALIDATOR VIEW (ENHANCED WITH DIAGNOSTIC ERRORS)
// ============================================================================

export const JsonFormatterView: React.FC = () => {
  const [input, setInput] = useState(
    '{\n  "platform": "MicroTools",\n  "features": ["100% Client-Side", "Privacy by Design"],\n  "version": 2.0,\n  "offlineReady": true\n}'
  )
  const [indent, setIndent] = useState<2 | 4 | '\t'>(2)
  const [sortKeys, setSortKeys] = useState(false)
  const [copied, setCopied] = useState(false)

  const sampleJson = () => {
    setInput(
      '{\n  "title": "MicroTools Client Utilities",\n  "tags": ["json", "crypto", "privacy"],\n  "security": {\n    "sandbox": "in-browser",\n    "serverUploads": false\n  },\n  "count": 40\n}'
    )
  }

  const result = useMemo(() => {
    return formatJson(input, { indent, sortKeys })
  }, [input, indent, sortKeys])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setInput(reader.result)
      }
    }
    reader.readAsText(file)
  }

  const handleCopy = () => {
    if (!result.output) return
    navigator.clipboard.writeText(result.output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!result.output) return
    const blob = new Blob([result.output], { type: 'application/json;charset=utf-8' })
    triggerFileDownload(blob, 'formatted.json')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Indent:</label>
            <select
              className="search-input"
              style={{ width: '110px', padding: '0.3rem 0.5rem' }}
              value={indent}
              onChange={(e) => {
                const val = e.target.value
                setIndent(val === 'tab' ? '\t' : (parseInt(val, 10) as 2 | 4))
              }}
            >
              <option value={2}>2 Spaces</option>
              <option value={4}>4 Spaces</option>
              <option value="tab">Tab</option>
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={sortKeys}
              onChange={(e) => setSortKeys(e.target.checked)}
            />
            Sort Keys Alphabetically
          </label>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Upload size={13} /> Upload JSON
            <input type="file" accept=".json,.txt" style={{ display: 'none' }} onChange={handleFileUpload} />
          </label>
          <button type="button" className="btn btn-secondary btn-sm" onClick={sampleJson}>
            <Sparkles size={13} /> Sample
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setInput('')}>
            Clear
          </button>
        </div>
      </div>

      {/* Inputs / Output Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Input JSON:</label>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {input.length} chars
            </span>
          </div>
          <textarea
            className="search-input"
            style={{ height: '320px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', lineHeight: 1.5 }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"key": "value"}'
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Formatted JSON Output:</label>
            {result.isValid && result.output && (
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleCopy}>
                  {copied ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={handleDownload}>
                  <Download size={13} /> Download .json
                </button>
              </div>
            )}
          </div>

          <textarea
            readOnly
            className="search-input"
            style={{
              height: '320px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              lineHeight: 1.5,
              backgroundColor: 'var(--bg-surface)',
            }}
            value={result.isValid ? result.output : ''}
            placeholder="Formatted JSON will display here once valid..."
          />
        </div>
      </div>

      {/* Syntax Error Diagnostic Banner */}
      {!result.isValid && result.error && (
        <div
          style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid var(--accent-rose)',
            color: 'var(--accent-rose)',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '0.4rem' }}>
            <AlertCircle size={16} />
            <span>
              JSON Syntax Error at Line {result.error.line}, Column {result.error.column}
            </span>
          </div>
          <div style={{ marginBottom: '0.5rem' }}>{result.error.message}</div>
          {result.error.snippet && (
            <pre
              style={{
                backgroundColor: 'var(--bg-primary)',
                padding: '0.65rem 0.85rem',
                borderRadius: '4px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
                overflowX: 'auto',
                margin: 0,
              }}
            >
              {result.error.snippet}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 5. JSON MINIFIER VIEW (GENUINE MINIFICATION & REDUCTION STATS)
// ============================================================================

export const JsonMinifierView: React.FC = () => {
  const [input, setInput] = useState(
    '{\n  "name": "MicroTools",\n  "tools": [\n    {\n      "id": "json-minifier",\n      "active": true\n    }\n  ],\n  "author": "Antigravity"\n}'
  )
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => {
    return minifyJson(input)
  }, [input])

  const handleCopy = () => {
    if (!result.output) return
    navigator.clipboard.writeText(result.output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!result.output) return
    const blob = new Blob([result.output], { type: 'application/json;charset=utf-8' })
    triggerFileDownload(blob, 'minified.json')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setInput(reader.result)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Removes all excess whitespace, tabs, and line breaks while preserving valid JSON syntax.
        </span>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Upload size={13} /> Upload JSON
            <input type="file" accept=".json,.txt" style={{ display: 'none' }} onChange={handleFileUpload} />
          </label>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setInput('')}>
            Clear
          </button>
        </div>
      </div>

      {/* Metrics Card */}
      {result.isValid && input.trim() && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '0.75rem',
          }}
        >
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {formatBytes(result.originalBytes)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Original Size</div>
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
              {formatBytes(result.minifiedBytes)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Minified Size</div>
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
              {formatBytes(result.bytesSaved)} ({result.savingsPercentage}%)
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bytes Reduced</div>
          </div>
        </div>
      )}

      {/* Input / Output */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            Input JSON:
          </label>
          <textarea
            className="search-input"
            style={{ height: '240px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', lineHeight: 1.5 }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste JSON to minify..."
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Minified Output:</label>
            {result.isValid && result.output && (
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleCopy}>
                  {copied ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={handleDownload}>
                  <Download size={13} /> Download
                </button>
              </div>
            )}
          </div>

          <textarea
            readOnly
            className="search-input"
            style={{
              height: '240px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              lineHeight: 1.5,
              wordBreak: 'break-all',
              backgroundColor: 'var(--bg-surface)',
            }}
            value={result.isValid ? result.output : ''}
            placeholder="Minified JSON will appear here..."
          />
        </div>
      </div>

      {/* Syntax Error Notice */}
      {!result.isValid && result.error && (
        <div
          style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid var(--accent-rose)',
            color: 'var(--accent-rose)',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '0.4rem' }}>
            <AlertCircle size={16} />
            <span>
              Cannot minify invalid JSON: Error at Line {result.error.line}, Column {result.error.column}
            </span>
          </div>
          <div>{result.error.message}</div>
          {result.error.snippet && (
            <pre
              style={{
                marginTop: '0.5rem',
                backgroundColor: 'var(--bg-primary)',
                padding: '0.65rem',
                borderRadius: '4px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {result.error.snippet}
            </pre>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 6. TEXT FILE CONVERTER VIEW
// ============================================================================

export const TextConverterView: React.FC = () => {
  const [input, setInput] = useState('Hello World!\nWelcome to MicroTools text converter.\nLine 3 with\t\ttabs.')
  const [conversionType, setConversionType] = useState<TextConversionType>('crlf-to-lf')
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => {
    return convertText(input, conversionType)
  }, [input, conversionType])

  const handleCopy = () => {
    navigator.clipboard.writeText(result.output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([result.output], { type: 'text/plain;charset=utf-8' })
    triggerFileDownload(blob, `converted_${conversionType}.txt`)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setInput(reader.result)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Conversion Mode Picker */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1rem',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Conversion Mode:</label>
          <select
            className="search-input"
            style={{ width: '250px', padding: '0.4rem 0.6rem' }}
            value={conversionType}
            onChange={(e) => setConversionType(e.target.value as TextConversionType)}
          >
            <optgroup label="Line Endings">
              <option value="crlf-to-lf">CRLF (Windows) → LF (Unix/macOS)</option>
              <option value="lf-to-crlf">LF (Unix/macOS) → CRLF (Windows)</option>
              <option value="to-cr">Normalize to CR (Classic Mac)</option>
            </optgroup>
            <optgroup label="Tabs & Spaces">
              <option value="tabs-to-spaces-2">Tabs → 2 Spaces</option>
              <option value="tabs-to-spaces-4">Tabs → 4 Spaces</option>
              <option value="spaces-to-tabs-2">2 Spaces → Tab</option>
              <option value="spaces-to-tabs-4">4 Spaces → Tab</option>
            </optgroup>
            <optgroup label="Data Representations">
              <option value="text-to-hex">Text → Hexadecimal Dump</option>
              <option value="hex-to-text">Hexadecimal Dump → Text</option>
              <option value="text-to-binary">Text → Binary Bits (0s and 1s)</option>
              <option value="binary-to-text">Binary Bits → Text</option>
              <option value="html-encode">HTML Entities Encode (&lt;, &gt;, &amp;)</option>
              <option value="html-decode">HTML Entities Decode</option>
            </optgroup>
            <optgroup label="Letter Case">
              <option value="uppercase">UPPERCASE</option>
              <option value="lowercase">lowercase</option>
              <option value="titlecase">Title Case</option>
            </optgroup>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Upload size={13} /> Load Text File
            <input type="file" accept=".txt,.md,.csv,.log,.json,.html" style={{ display: 'none' }} onChange={handleFileUpload} />
          </label>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setInput('')}>
            Clear
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.75rem',
        }}
      >
        <div style={{ padding: '0.65rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            {result.stats.inputLines} → {result.stats.outputLines}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lines</div>
        </div>

        <div style={{ padding: '0.65rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
            {result.stats.inputChars} → {result.stats.outputChars}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Characters</div>
        </div>

        <div style={{ padding: '0.65rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
            {formatBytes(result.stats.outputBytes)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Output Bytes</div>
        </div>
      </div>

      {result.error && (
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
          ❌ {result.error}
        </div>
      )}

      {/* Side-by-side or stacked views */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            Input Text:
          </label>
          <textarea
            className="search-input"
            style={{ height: '260px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', lineHeight: 1.5 }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type or paste text..."
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Converted Text:</label>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleCopy}>
                {copied ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleDownload}>
                <Download size={13} /> Download
              </button>
            </div>
          </div>

          <textarea
            readOnly
            className="search-input"
            style={{
              height: '260px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              lineHeight: 1.5,
              backgroundColor: 'var(--bg-surface)',
            }}
            value={result.output}
          />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 7. TEXT CASE CONVERTER
// ============================================================================

export const CaseConverterView: React.FC = () => {
  const [text, setText] = useState('Convert your text to any case format instantly.')
  const [copiedCase, setCopiedCase] = useState<string | null>(null)

  const cases = [
    { id: 'uppercase', label: 'UPPERCASE', result: convertCase(text, 'uppercase') },
    { id: 'lowercase', label: 'lowercase', result: convertCase(text, 'lowercase') },
    { id: 'titlecase', label: 'Title Case', result: convertCase(text, 'titlecase') },
    { id: 'camelcase', label: 'camelCase', result: convertCase(text, 'camelcase') },
    { id: 'snakecase', label: 'snake_case', result: convertCase(text, 'snakecase') },
    { id: 'kebabcase', label: 'kebab-case', result: convertCase(text, 'kebabcase') },
  ] as const

  const copyVal = (val: string, id: string) => {
    navigator.clipboard.writeText(val)
    setCopiedCase(id)
    setTimeout(() => setCopiedCase(null), 1500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
          Input Text:
        </label>
        <textarea
          className="search-input"
          style={{ height: '110px' }}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        {cases.map((c) => (
          <div
            key={c.id}
            style={{
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>{c.label}</span>
              <button
                type="button"
                className="btn-icon"
                onClick={() => copyVal(c.result, c.id)}
                title="Copy to clipboard"
              >
                {copiedCase === c.id ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
              </button>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
              {c.result || '...'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// 8. TEXT TO PDF VIEW
// ============================================================================

export const TextToPdfView: React.FC = () => {
  const [text, setText] = useState(
    '# Document Title\n\nThis document was generated purely inside your web browser using client-side vector drawing APIs.\n\nMicroTools guarantees 100% privacy with zero server uploads.\n\nFeatures:\n- Automatic line wrapping\n- Multi-page pagination\n- Configurable font sizes & page margins\n- Page number footers'
  )
  const [fontSize, setFontSize] = useState<number>(12)
  const [margins, setMargins] = useState<number>(50)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [includePageNumbers, setIncludePageNumbers] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setText(reader.result)
        setGeneratedBlob(null)
      }
    }
    reader.readAsText(file)
  }

  const handleGeneratePdf = async () => {
    if (!text.trim()) return
    try {
      setIsGenerating(true)
      const blob = await textToPdf(text, {
        fontSize,
        margins,
        orientation,
        includePageNumbers,
      })
      setGeneratedBlob(blob)
    } catch (err: any) {
      alert(`Failed to generate PDF: ${err.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadTxt = () => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    triggerFileDownload(blob, 'document.txt')
  }

  const handleDownloadPdf = () => {
    if (!generatedBlob) return
    triggerFileDownload(generatedBlob, 'document.pdf')
  }

  const words = text.trim() ? text.trim().split(/\s+/).length : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Fidelity Label */}
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
            Lays out plain text into formatted multi-page vector PDF pages with automatic line wrapping.
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Upload size={13} /> Upload .txt
            <input type="file" accept=".txt,.log" style={{ display: 'none' }} onChange={handleFileUpload} />
          </label>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleDownloadTxt}>
            <Download size={13} /> Save TXT
          </button>
        </div>
      </div>

      {/* Configuration Toolbar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          padding: '1.25rem',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            Font Size:
          </label>
          <select
            className="search-input"
            value={fontSize}
            onChange={(e) => {
              setFontSize(parseInt(e.target.value, 10))
              setGeneratedBlob(null)
            }}
          >
            <option value={10}>10 pt (Compact)</option>
            <option value={12}>12 pt (Standard Body)</option>
            <option value={14}>14 pt (Large)</option>
            <option value={16}>16 pt (Extra Large)</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            Orientation:
          </label>
          <select
            className="search-input"
            value={orientation}
            onChange={(e) => {
              setOrientation(e.target.value as any)
              setGeneratedBlob(null)
            }}
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            Margins:
          </label>
          <select
            className="search-input"
            value={margins}
            onChange={(e) => {
              setMargins(parseInt(e.target.value, 10))
              setGeneratedBlob(null)
            }}
          >
            <option value={36}>Narrow (0.5 inch / 36pt)</option>
            <option value={50}>Normal (0.7 inch / 50pt)</option>
            <option value={72}>Wide (1.0 inch / 72pt)</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', paddingTop: '1.25rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={includePageNumbers}
              onChange={(e) => {
                setIncludePageNumbers(e.target.checked)
                setGeneratedBlob(null)
              }}
            />
            Include Page Numbers
          </label>
        </div>
      </div>

      {/* Text Editor */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Text Content:</label>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {text.length} chars • {words} words
          </span>
        </div>
        <textarea
          className="search-input"
          style={{ height: '240px', lineHeight: 1.6 }}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setGeneratedBlob(null)
          }}
          placeholder="Enter text to convert to PDF..."
        />
      </div>

      {/* Action Row */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleGeneratePdf}
          disabled={isGenerating || !text.trim()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
        >
          <FileText size={15} />
          {isGenerating ? 'Composing PDF...' : 'Generate PDF'}
        </button>

        {generatedBlob && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleDownloadPdf}
            style={{ backgroundColor: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <Download size={15} /> Download PDF ({formatBytes(generatedBlob.size)})
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// 9. MARKDOWN TO HTML VIEW
// ============================================================================

export const MarkdownToHtmlView: React.FC = () => {
  const [markdown, setMarkdown] = useState(
    '# Markdown to HTML\n\nConvert **GitHub-flavored Markdown** into clean, sanitized HTML markup.\n\n### Features\n- Sanitized with `DOMPurify` to eliminate XSS risks\n- Live side-by-side preview\n- 1-click HTML export\n\n> "Simplicity is the ultimate sophistication." — Leonardo da Vinci'
  )
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview')
  const [copied, setCopied] = useState(false)

  const htmlOutput = useMemo(() => parseMarkdown(markdown), [markdown])

  const handleCopy = () => {
    navigator.clipboard.writeText(htmlOutput)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadHtml = () => {
    const fullDoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Converted Document</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 2rem auto; padding: 0 1rem; color: #333; }
    pre { background: #f4f4f4; padding: 1rem; border-radius: 4px; overflow-x: auto; }
    blockquote { border-left: 4px solid #0284c7; margin: 0; padding-left: 1rem; color: #666; }
    code { background: #f0f0f0; padding: 2px 4px; border-radius: 3px; font-size: 0.9em; }
  </style>
</head>
<body>
${htmlOutput}
</body>
</html>`
    const blob = new Blob([fullDoc], { type: 'text/html;charset=utf-8' })
    triggerFileDownload(blob, 'converted_document.html')
  }

  const handleDownloadMd = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    triggerFileDownload(blob, 'source_document.md')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Fidelity Label */}
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
            [Layout-Preserving Conversion]
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Translates Markdown AST into semantic HTML markup, sanitized via DOMPurify.
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleDownloadMd}>
            Save .md
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleCopy}>
            {copied ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
            {copied ? 'HTML Copied' : 'Copy HTML'}
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleDownloadHtml}>
            <Download size={13} /> Download .html
          </button>
        </div>
      </div>

      {/* Editor & Preview Split */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            Markdown Input:
          </label>
          <textarea
            className="search-input"
            style={{ height: '380px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', lineHeight: 1.5 }}
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>HTML Output:</label>
            <div style={{ display: 'flex', gap: '0.3rem' }}>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'preview' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                onClick={() => setViewMode('preview')}
              >
                <Eye size={12} /> Preview
              </button>
              <button
                type="button"
                className={`btn btn-sm ${viewMode === 'code' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                onClick={() => setViewMode('code')}
              >
                <Code size={12} /> Raw HTML
              </button>
            </div>
          </div>

          {viewMode === 'preview' ? (
            <div
              className="search-input"
              style={{
                height: '380px',
                overflowY: 'auto',
                backgroundColor: 'var(--bg-surface)',
                lineHeight: 1.6,
                fontSize: '0.9rem',
              }}
              dangerouslySetInnerHTML={{ __html: htmlOutput }}
            />
          ) : (
            <textarea
              readOnly
              className="search-input"
              style={{
                height: '380px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                lineHeight: 1.5,
                backgroundColor: 'var(--bg-surface)',
              }}
              value={htmlOutput}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 10. MARKDOWN TO PDF VIEW
// ============================================================================

export const MarkdownToPdfView: React.FC = () => {
  const [markdown, setMarkdown] = useState(
    '# Project Overview\n\nThis PDF was generated directly from Markdown in the browser runtime.\n\n## Core Principles\n- 100% In-Browser Execution\n- Zero Server Round-Trips\n- Standard Vector PDF Rendering\n\n### Formatting Demo\nRegular body paragraphs are automatically flowed across lines. Headings use bold typography, code blocks are styled, and bullet points are rendered cleanly.'
  )
  const [paperSize, setPaperSize] = useState<'a4' | 'letter'>('a4')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null)

  const htmlPreview = useMemo(() => parseMarkdown(markdown), [markdown])

  const handleGeneratePdf = async () => {
    if (!markdown.trim()) return
    try {
      setIsGenerating(true)
      const blob = await markdownToPdf(markdown, { paperSize })
      setGeneratedBlob(blob)
    } catch (err: any) {
      alert(`Error generating PDF: ${err.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!generatedBlob) return
    triggerFileDownload(generatedBlob, 'markdown_document.pdf')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Fidelity Badge */}
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
            [Layout-Preserving Conversion]
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Renders structured headings, lists, quotes, and code blocks into a multi-page vector PDF.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Paper Size:</label>
          <select
            className="search-input"
            style={{ width: '100px', padding: '0.25rem 0.5rem' }}
            value={paperSize}
            onChange={(e) => {
              setPaperSize(e.target.value as any)
              setGeneratedBlob(null)
            }}
          >
            <option value="a4">A4</option>
            <option value="letter">Letter</option>
          </select>
        </div>
      </div>

      {/* Editor & Preview Split */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            Markdown Content:
          </label>
          <textarea
            className="search-input"
            style={{ height: '320px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', lineHeight: 1.5 }}
            value={markdown}
            onChange={(e) => {
              setMarkdown(e.target.value)
              setGeneratedBlob(null)
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            Formatted Preview:
          </label>
          <div
            className="search-input"
            style={{
              height: '320px',
              overflowY: 'auto',
              backgroundColor: 'var(--bg-surface)',
              lineHeight: 1.6,
              fontSize: '0.9rem',
            }}
            dangerouslySetInnerHTML={{ __html: htmlPreview }}
          />
        </div>
      </div>

      {/* Action Row */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleGeneratePdf}
          disabled={isGenerating || !markdown.trim()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
        >
          <FileText size={15} />
          {isGenerating ? 'Rendering Vector PDF...' : 'Convert to PDF'}
        </button>

        {generatedBlob && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleDownload}
            style={{ backgroundColor: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <Download size={15} /> Download PDF ({formatBytes(generatedBlob.size)})
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// 11. WORD TO PDF VIEW
// ============================================================================

export const WordToPdfView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelected = async (files: File[]) => {
    const f = files[0]
    if (!f) return

    setFile(f)
    setError(null)
    setPdfBlob(null)
    setIsProcessing(true)

    try {
      const blob = await docxToPdf(f, (p, s) => {
        setProgress(p)
        setStatus(s)
      })
      setPdfBlob(blob)
    } catch (err: any) {
      setError(err.message || 'Failed to convert Word document to PDF.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!pdfBlob || !file) return
    const baseName = file.name.replace(/\.[^/.]+$/, '')
    triggerFileDownload(pdfBlob, `${baseName}.pdf`)
  }

  const handleReset = () => {
    setFile(null)
    setPdfBlob(null)
    setError(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Fidelity Label & Disclosure Banner */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          padding: '1rem 1.25rem',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className="badge badge-amber" style={{ fontWeight: 700 }}>
            [Approximate / Structure-Preserving Conversion]
          </span>
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
            Client-Side Office OpenXML Parser
          </span>
        </div>
        <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Unpacks the Microsoft Word <code>.docx</code> XML archive directly in the browser, parsing paragraphs, headings, bold/italic text runs, and tables. Proprietary WordArt, complex macros, and embedded vector canvas drawings are omitted.
        </p>
      </div>

      {!file ? (
        <FileDropZone
          acceptedTypes={['.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']}
          onFilesSelected={handleFileSelected}
          title="Drop a Microsoft Word (.docx) file to convert to PDF"
          supportsMultipleFiles={false}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <strong>{file.name}</strong> ({formatBytes(file.size)})
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleReset} disabled={isProcessing}>
              <RefreshCw size={14} /> New Document
            </button>
          </div>

          {isProcessing && <ProgressBar progress={progress} statusText={status} />}

          {pdfBlob && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.25rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--accent-emerald)',
              }}
            >
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  PDF Generated Successfully
                </h4>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  Size: {formatBytes(pdfBlob.size)} • Pure vector PDF with text searchability
                </p>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDownload}
                style={{ backgroundColor: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <Download size={15} /> Download PDF
              </button>
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

