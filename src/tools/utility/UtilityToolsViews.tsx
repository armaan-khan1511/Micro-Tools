import React, { useState, useEffect } from 'react'
import {
  generateQrDataUrl,
  generateQrSvg,
  generateSecurePassword,
  generateUuids,
  calculateContrastRatio,
} from '../../core/engine/utility/utilityEngine'
import { Copy, Check, Download, RefreshCw, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react'

// --- 1. QR CODE GENERATOR ---
export const QrGeneratorView: React.FC = () => {
  const [text, setText] = useState('https://microtools.vercel.app')
  const [darkColor, setDarkColor] = useState('#000000')
  const [lightColor, setLightColor] = useState('#ffffff')
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [copiedSvg, setCopiedSvg] = useState(false)

  useEffect(() => {
    if (!text.trim()) {
      setQrUrl(null)
      return
    }
    generateQrDataUrl(text, { darkColor, lightColor, width: 350 }).then(setQrUrl)
  }, [text, darkColor, lightColor])

  const copySvg = async () => {
    if (!text.trim()) return
    const svg = await generateQrSvg(text, { darkColor, lightColor })
    navigator.clipboard.writeText(svg)
    setCopiedSvg(true)
    setTimeout(() => setCopiedSvg(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              QR Code Content (URL or Text):
            </label>
            <input
              type="text"
              className="search-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Foreground:
              </label>
              <input
                type="color"
                value={darkColor}
                onChange={(e) => setDarkColor(e.target.value)}
                style={{ width: '45px', height: '35px', cursor: 'pointer', borderRadius: '4px', border: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Background:
              </label>
              <input
                type="color"
                value={lightColor}
                onChange={(e) => setLightColor(e.target.value)}
                style={{ width: '45px', height: '35px', cursor: 'pointer', borderRadius: '4px', border: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            {qrUrl && (
              <a href={qrUrl} download="qrcode.png" className="btn btn-primary">
                <Download size={15} /> Download PNG
              </a>
            )}
            <button type="button" className="btn btn-secondary" onClick={copySvg}>
              {copiedSvg ? <Check size={15} color="var(--accent-emerald)" /> : <Copy size={15} />}
              {copiedSvg ? 'SVG Copied!' : 'Copy SVG'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)' }}>
          {qrUrl ? (
            <img src={qrUrl} alt="Generated QR Code" style={{ width: '220px', height: '220px', borderRadius: '8px' }} />
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Enter text to generate QR code</div>
          )}
        </div>
      </div>
    </div>
  )
}

// --- 2. CRYPTOGRAPHIC PASSWORD GENERATOR ---
export const PasswordGeneratorView: React.FC = () => {
  const [length, setLength] = useState(20)
  const [uppercase, setUppercase] = useState(true)
  const [lowercase, setLowercase] = useState(true)
  const [numbers, setNumbers] = useState(true)
  const [symbols, setSymbols] = useState(true)
  const [password, setPassword] = useState('')
  const [entropy, setEntropy] = useState(0)
  const [copied, setCopied] = useState(false)

  const regenerate = () => {
    const res = generateSecurePassword(length, { uppercase, lowercase, numbers, symbols })
    setPassword(res.password)
    setEntropy(res.entropyBits)
  }

  useEffect(() => {
    regenerate()
  }, [length, uppercase, lowercase, numbers, symbols])

  const copyPassword = () => {
    navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Password display bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.35rem', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
          {password}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <button type="button" className="btn-icon" onClick={regenerate} title="Regenerate password">
            <RefreshCw size={17} />
          </button>
          <button type="button" className="btn btn-primary" onClick={copyPassword}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
        <span className="badge badge-green">
          <ShieldCheck size={12} /> {entropy} bits entropy (Cryptographically Strong)
        </span>
        <span style={{ color: 'var(--text-muted)' }}>Generated using browser Web Crypto CSPRNG</span>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>Password Length:</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>{length} chars</span>
          </div>
          <input
            type="range"
            min="8"
            max="64"
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value, 10))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {[
            { label: 'Uppercase (A-Z)', val: uppercase, set: setUppercase },
            { label: 'Lowercase (a-z)', val: lowercase, set: setLowercase },
            { label: 'Numbers (0-9)', val: numbers, set: setNumbers },
            { label: 'Symbols (!@#$)', val: symbols, set: setSymbols },
          ].map((opt, idx) => (
            <label
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                fontSize: '0.85rem',
                padding: '0.6rem 0.85rem',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={opt.val}
                onChange={(e) => opt.set(e.target.checked)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

// --- 3. BULK UUID GENERATOR ---
export const UuidGeneratorView: React.FC = () => {
  const [count, setCount] = useState(5)
  const [uuids, setUuids] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  const regenerate = () => {
    setUuids(generateUuids(count))
  }

  useEffect(() => {
    regenerate()
  }, [count])

  const copyAll = () => {
    navigator.clipboard.writeText(uuids.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Quantity:</label>
          <select
            className="search-input"
            style={{ width: '100px', padding: '0.4rem 0.6rem' }}
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value, 10))}
          >
            {[1, 5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>{n} UUIDs</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={regenerate}>
            <RefreshCw size={14} /> Regenerate
          </button>
          <button type="button" className="btn btn-primary" onClick={copyAll}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied All!' : 'Copy All UUIDs'}
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          maxHeight: '350px',
          overflowY: 'auto',
        }}
      >
        {uuids.map((id, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.65rem 0.85rem',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
            }}
          >
            <span>{id}</span>
            <button
              type="button"
              className="btn-icon"
              style={{ padding: '0.25rem' }}
              onClick={() => navigator.clipboard.writeText(id)}
              title="Copy UUID"
            >
              <Copy size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- 4. COLOR CONTRAST (WCAG 2.1) CHECKER ---
export const ColorContrastView: React.FC = () => {
  const [foreground, setForeground] = useState('#0ea5e9')
  const [background, setBackground] = useState('#09090b')

  const contrast = calculateContrastRatio(foreground, background)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            Foreground (Text) Color:
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="color"
              value={foreground}
              onChange={(e) => setForeground(e.target.value)}
              style={{ width: '45px', height: '38px', cursor: 'pointer', borderRadius: '4px', border: 'none' }}
            />
            <input
              type="text"
              className="search-input"
              value={foreground}
              onChange={(e) => setForeground(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            Background Color:
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="color"
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              style={{ width: '45px', height: '38px', cursor: 'pointer', borderRadius: '4px', border: 'none' }}
            />
            <input
              type="text"
              className="search-input"
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
        </div>
      </div>

      {/* Contrast Ratio Result Card */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>
          {contrast.ratio}:1
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span className={`badge ${contrast.aaNormal ? 'badge-green' : 'badge-amber'}`}>
            {contrast.aaNormal ? <CheckCircle2 size={12} /> : <XCircle size={12} />} WCAG AA (Normal Text: 4.5:1)
          </span>
          <span className={`badge ${contrast.aaLarge ? 'badge-green' : 'badge-amber'}`}>
            {contrast.aaLarge ? <CheckCircle2 size={12} /> : <XCircle size={12} />} WCAG AA (Large Text: 3:1)
          </span>
          <span className={`badge ${contrast.aaaNormal ? 'badge-green' : 'badge-amber'}`}>
            {contrast.aaaNormal ? <CheckCircle2 size={12} /> : <XCircle size={12} />} WCAG AAA (Enhanced: 7:1)
          </span>
        </div>
      </div>

      {/* Live Preview Box */}
      <div
        style={{
          padding: '2rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: background,
          color: foreground,
          border: '1px solid var(--border-subtle)',
        }}
      >
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Sample Preview Heading
        </h3>
        <p style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>
          This preview demonstrates your color contrast combination in real-time. Accessible color contrast
          guarantees that all users can read and interact with your web interface comfortably.
        </p>
      </div>
    </div>
  )
}
