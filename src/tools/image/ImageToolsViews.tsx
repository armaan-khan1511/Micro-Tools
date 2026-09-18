import React, { useState } from 'react'
import { DropZone } from '../../components/common/DropZone'
import { ActionButtons } from '../../components/common/ActionButtons'
import {
  compressImage,
  convertImageFormat,
  extractColorPalette,
  stripExifMetadata,
} from '../../core/engine/image/imageEngine'
import { Copy, Check, ShieldCheck } from 'lucide-react'

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// --- 1. IMAGE COMPRESSOR ---
export const ImageCompressView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [quality, setQuality] = useState(0.8)
  const [format, setFormat] = useState<'image/jpeg' | 'image/webp'>('image/jpeg')
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{
    url: string
    originalSize: number
    compressedSize: number
    savings: number
  } | null>(null)

  const handleCompress = async () => {
    if (!file) return
    setIsProcessing(true)
    try {
      const res = await compressImage(file, quality, undefined, format)
      const url = URL.createObjectURL(res.blob)
      setResult({
        url,
        originalSize: res.originalSize,
        compressedSize: res.compressedSize,
        savings: res.savingsPercent,
      })
    } catch (e) {
      console.error(e)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {!file ? (
        <DropZone
          accepts={['image/*']}
          onFilesSelected={(files) => {
            setFile(files[0])
            setResult(null)
          }}
          title="Drop image to compress (JPG, PNG, WebP)"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><strong>{file.name}</strong> ({formatBytes(file.size)})</span>
            <button type="button" className="btn btn-secondary" onClick={() => setFile(null)}>Change Image</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Compression Quality: {Math.round(quality * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="0.95"
                step="0.05"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Output Encoding:
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className={`btn ${format === 'image/jpeg' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                  onClick={() => setFormat('image/jpeg')}
                >
                  JPEG
                </button>
                <button
                  type="button"
                  className={`btn ${format === 'image/webp' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                  onClick={() => setFormat('image/webp')}
                >
                  WebP (Higher Efficiency)
                </button>
              </div>
            </div>
          </div>

          {result && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--badge-green-bg)',
                border: '1px solid var(--badge-green-border)',
              }}
            >
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--badge-green-text)' }}>
                  Reduced by {result.savings}%
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Original: {formatBytes(result.originalSize)} → Compressed: {formatBytes(result.compressedSize)}
                </div>
              </div>
              <img src={result.url} alt="Compressed preview" style={{ height: '56px', borderRadius: '4px', objectFit: 'cover' }} />
            </div>
          )}

          <ActionButtons
            onProcess={handleCompress}
            isProcessing={isProcessing}
            processLabel="Compress Image"
            downloadUrl={result?.url}
            downloadFilename={`compressed_${file.name.replace(/\.[^/.]+$/, '')}.${format === 'image/webp' ? 'webp' : 'jpg'}`}
            onReset={() => {
              setFile(null)
              setResult(null)
            }}
          />
        </div>
      )}
    </div>
  )
}

// --- 2. IMAGE CONVERTER ---
export const ImageConvertView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [targetFormat, setTargetFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/png')
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  const handleConvert = async () => {
    if (!file) return
    setIsProcessing(true)
    try {
      const blob = await convertImageFormat(file, targetFormat)
      setDownloadUrl(URL.createObjectURL(blob))
    } catch (e) {
      console.error(e)
    } finally {
      setIsProcessing(false)
    }
  }

  const ext = targetFormat === 'image/png' ? 'png' : targetFormat === 'image/jpeg' ? 'jpg' : 'webp'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {!file ? (
        <DropZone accepts={['image/*']} onFilesSelected={(files) => setFile(files[0])} title="Drop image to convert format" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><strong>{file.name}</strong></span>
            <button type="button" className="btn btn-secondary" onClick={() => setFile(null)}>Change Image</button>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Select Output Format:
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['image/png', 'image/jpeg', 'image/webp'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  className={`btn ${targetFormat === fmt ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setTargetFormat(fmt)}
                >
                  {fmt === 'image/png' ? 'PNG' : fmt === 'image/jpeg' ? 'JPEG / JPG' : 'WebP'}
                </button>
              ))}
            </div>
          </div>

          <ActionButtons
            onProcess={handleConvert}
            isProcessing={isProcessing}
            processLabel={`Convert to ${ext.toUpperCase()}`}
            downloadUrl={downloadUrl}
            downloadFilename={`${file.name.replace(/\.[^/.]+$/, '')}.${ext}`}
            onReset={() => {
              setFile(null)
              setDownloadUrl(null)
            }}
          />
        </div>
      )}
    </div>
  )
}

// --- 3. COLOR PALETTE EXTRACTOR ---
export const ColorPaletteView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [colors, setColors] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [copiedHex, setCopiedHex] = useState<string | null>(null)

  const handleFile = async (files: File[]) => {
    const f = files[0]
    if (!f) return
    setFile(f)
    setIsProcessing(true)
    try {
      const palette = await extractColorPalette(f, 6)
      setColors(palette)
    } catch (e) {
      console.error(e)
    } finally {
      setIsProcessing(false)
    }
  }

  const copyColor = (hex: string) => {
    navigator.clipboard.writeText(hex)
    setCopiedHex(hex)
    setTimeout(() => setCopiedHex(null), 1500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {!file ? (
        <DropZone accepts={['image/*']} onFilesSelected={handleFile} title="Drop image to extract color palette" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><strong>{file.name}</strong></span>
            <button type="button" className="btn btn-secondary" onClick={() => setFile(null)}>New Image</button>
          </div>

          {isProcessing && (
            <div style={{ color: 'var(--accent-primary)', fontSize: '0.85rem' }}>
              Extracting dominant colors locally...
            </div>
          )}

          {colors.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '1rem' }}>
              {colors.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => copyColor(hex)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '60px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: hex,
                      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)',
                    }}
                  />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {hex.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    {copiedHex === hex ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                    {copiedHex === hex ? 'Copied' : 'Click to copy'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// --- 4. EXIF STRIPPER ---
export const ExifStripperView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleStrip = async () => {
    if (!file) return
    setIsProcessing(true)
    try {
      const blob = await stripExifMetadata(file)
      setDownloadUrl(URL.createObjectURL(blob))
    } catch (e) {
      console.error(e)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {!file ? (
        <DropZone accepts={['image/jpeg', 'image/png', '.jpg', '.jpeg', '.png']} onFilesSelected={(f) => setFile(f[0])} title="Drop photo to remove EXIF & GPS metadata" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><strong>{file.name}</strong> ({formatBytes(file.size)})</span>
            <button type="button" className="btn btn-secondary" onClick={() => setFile(null)}>Change Image</button>
          </div>

          <div className="badge badge-green" style={{ padding: '0.5rem 0.75rem' }}>
            <ShieldCheck size={16} /> Strips GPS coordinates, camera model, date/time stamps, and hardware serials.
          </div>

          <ActionButtons
            onProcess={handleStrip}
            isProcessing={isProcessing}
            processLabel="Sanitize & Strip EXIF"
            downloadUrl={downloadUrl}
            downloadFilename={`sanitized_${file.name}`}
            onReset={() => {
              setFile(null)
              setDownloadUrl(null)
            }}
          />
        </div>
      )}
    </div>
  )
}
