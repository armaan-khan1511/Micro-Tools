import React, { useState } from 'react'
import { DropZone } from '../../components/common/DropZone'
import { ProgressBar } from '../../components/common/ProgressBar'
import { ActionButtons } from '../../components/common/ActionButtons'
import {
  createZip,
  inspectZip,
  extractZipEntry,
  calculateFileHash,
  fileToBase64,
  base64ToBlob,
  type ZipEntryInfo,
} from '../../core/engine/archive/archiveEngine'
import { Download, File, Copy, Check } from 'lucide-react'

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// --- 1. ZIP CREATOR ---
export const ZipCreatorView: React.FC = () => {
  const [files, setFiles] = useState<File[]>([])
  const [zipName, setZipName] = useState('archive.zip')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  const handleCreateZip = async () => {
    try {
      setIsProcessing(true)
      const blob = await createZip(files, (p, s) => {
        setProgress(p)
        setStatus(s)
      })
      setDownloadUrl(URL.createObjectURL(blob))
    } catch (e) {
      console.error(e)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <DropZone
        multiple
        selectedFiles={files}
        onFilesSelected={(newFiles) => setFiles((prev) => [...prev, ...newFiles])}
        onRemoveFile={(idx) => setFiles(files.filter((_, i) => i !== idx))}
        title="Drop any files or folders to compress into ZIP"
      />

      {files.length > 0 && (
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            Archive File Name:
          </label>
          <input
            type="text"
            className="search-input"
            style={{ paddingLeft: '1rem', maxWidth: '320px' }}
            value={zipName}
            onChange={(e) => setZipName(e.target.value)}
          />
        </div>
      )}

      {isProcessing && <ProgressBar progress={progress} statusText={status} />}

      <ActionButtons
        onProcess={handleCreateZip}
        isProcessing={isProcessing}
        processLabel={`Create ${zipName}`}
        canProcess={files.length > 0}
        downloadUrl={downloadUrl}
        downloadFilename={zipName.endsWith('.zip') ? zipName : `${zipName}.zip`}
        onReset={() => {
          setFiles([])
          setDownloadUrl(null)
          setProgress(0)
        }}
      />
    </div>
  )
}

// --- 2. ZIP EXTRACTOR & VIEWER ---
export const ZipExtractorView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [entries, setEntries] = useState<ZipEntryInfo[]>([])

  const handleZipFile = async (files: File[]) => {
    const f = files[0]
    if (!f) return
    setFile(f)
    try {
      const list = await inspectZip(f)
      setEntries(list)
    } catch (e) {
      console.error(e)
    }
  }

  const handleDownloadEntry = async (entryName: string) => {
    if (!file) return
    const blob = await extractZipEntry(file, entryName)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = entryName.split('/').pop() || 'extracted_file'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {!file ? (
        <DropZone
          accepts={['.zip', 'application/zip', 'application/x-zip-compressed']}
          onFilesSelected={handleZipFile}
          title="Drop .zip file to inspect and extract contents"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><strong>{file.name}</strong> ({entries.length} items found)</span>
            <button type="button" className="btn btn-secondary" onClick={() => setFile(null)}>Open Different ZIP</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto' }}>
            {entries.map((entry, idx) => (
              <div
                key={`${entry.name}-${idx}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.85rem',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <File size={15} color="var(--accent-primary)" />
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{entry.name}</span>
                  {!entry.isDir && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      ({formatBytes(entry.size)})
                    </span>
                  )}
                </div>

                {!entry.isDir && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                    onClick={() => handleDownloadEntry(entry.name)}
                  >
                    <Download size={13} /> Extract
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// --- 3. CRYPTOGRAPHIC HASH GENERATOR ---
export const FileHashView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [algorithm, setAlgorithm] = useState<'SHA-256' | 'SHA-512' | 'SHA-1'>('SHA-256')
  const [hash, setHash] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCompute = async (targetFile: File, algo: 'SHA-256' | 'SHA-512' | 'SHA-1') => {
    try {
      const digest = await calculateFileHash(targetFile, algo)
      setHash(digest)
    } catch (e) {
      console.error(e)
    }
  }

  const handleCopy = () => {
    if (!hash) return
    navigator.clipboard.writeText(hash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {!file ? (
        <DropZone
          onFilesSelected={(f) => {
            setFile(f[0])
            handleCompute(f[0], algorithm)
          }}
          title="Drop any file to calculate cryptographic hash (SHA-256 / SHA-512)"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><strong>{file.name}</strong> ({formatBytes(file.size)})</span>
            <button type="button" className="btn btn-secondary" onClick={() => setFile(null)}>New File</button>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Algorithm:
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['SHA-256', 'SHA-512', 'SHA-1'] as const).map((algo) => (
                <button
                  key={algo}
                  type="button"
                  className={`btn ${algorithm === algo ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    setAlgorithm(algo)
                    handleCompute(file, algo)
                  }}
                >
                  {algo}
                </button>
              ))}
            </div>
          </div>

          {hash && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {algorithm} Checksum:
              </div>
              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  wordBreak: 'break-all',
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <span>{hash}</span>
                <button type="button" className="btn btn-secondary" onClick={handleCopy}>
                  {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// --- 4. BASE64 ENCODER & DECODER ---
export const Base64View: React.FC = () => {
  const [base64Output, setBase64Output] = useState('')
  const [inputBase64, setInputBase64] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')

  const handleEncode = async (files: File[]) => {
    const f = files[0]
    if (!f) return
    const str = await fileToBase64(f)
    setBase64Output(str)
  }

  const handleDownloadDecoded = () => {
    if (!inputBase64.trim()) return
    const blob = base64ToBlob(inputBase64)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'decoded_file.bin'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="button"
          className={`btn ${mode === 'encode' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setMode('encode')}
        >
          File → Base64
        </button>
        <button
          type="button"
          className={`btn ${mode === 'decode' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setMode('decode')}
        >
          Base64 → File
        </button>
      </div>

      {mode === 'encode' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <DropZone onFilesSelected={handleEncode} title="Drop any file to convert to Base64 Data URI" />
          {base64Output && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Base64 String:</span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigator.clipboard.writeText(base64Output)}
                >
                  <Copy size={14} /> Copy Base64
                </button>
              </div>
              <textarea
                readOnly
                className="search-input"
                style={{ height: '140px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                value={base64Output}
              />
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Paste Base64 or Data URI string:
            </label>
            <textarea
              className="search-input"
              style={{ height: '140px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
              value={inputBase64}
              onChange={(e) => setInputBase64(e.target.value)}
              placeholder="data:image/png;base64,iVBORw0KGgo..."
            />
          </div>
          <button type="button" className="btn btn-primary" onClick={handleDownloadDecoded} disabled={!inputBase64.trim()}>
            <Download size={15} /> Decode & Download File
          </button>
        </div>
      )}
    </div>
  )
}
