import React, { useState, useMemo } from 'react'
import {
  parseMarkdown,
  analyzeText,
  computeTextDiff,
  convertCase,
  processJson,
} from '../../core/engine/document/documentEngine'
import { Copy, Check, AlertCircle } from 'lucide-react'

// --- 1. MARKDOWN PREVIEW & EDITOR ---
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

// --- 2. WORD & READING TIME COUNTER ---
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

// --- 3. TEXT DIFF & COMPARISON ---
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
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
          {diffChunks.map((part, index) => {
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

// --- 4. JSON FORMATTER & VALIDATOR ---
export const JsonFormatterView: React.FC = () => {
  const [input, setInput] = useState('{"platform":"MicroTools","privacy":"100% Client-Side","tools":40}')
  const [result, setResult] = useState<{ output: string; isValid: boolean; error?: string }>({
    output: '',
    isValid: true,
  })
  const [copied, setCopied] = useState(false)

  const handleProcess = (mode: 'format' | 'minify') => {
    const res = processJson(input, mode)
    setResult(res)
  }

  const handleCopy = () => {
    if (!result.output) return
    navigator.clipboard.writeText(result.output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-primary" onClick={() => handleProcess('format')}>
          Format (Pretty Print)
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => handleProcess('minify')}>
          Minify JSON
        </button>
        {result.output && (
          <button type="button" className="btn btn-secondary" onClick={handleCopy}>
            {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy Output'}
          </button>
        )}
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
          Input JSON:
        </label>
        <textarea
          className="search-input"
          style={{ height: '180px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='{"key": "value"}'
        />
      </div>

      {!result.isValid && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-rose)', fontSize: '0.85rem' }}>
          <AlertCircle size={16} />
          <span>Invalid JSON Syntax: {result.error}</span>
        </div>
      )}

      {result.output && result.isValid && (
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            Processed JSON Output:
          </label>
          <textarea
            readOnly
            className="search-input"
            style={{ height: '220px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
            value={result.output}
          />
        </div>
      )}
    </div>
  )
}

// --- 5. TEXT CASE CONVERTER ---
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
