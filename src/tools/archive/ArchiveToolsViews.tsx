import React, { useState } from 'react'
import {
  Download,
  File,
  Folder,
  Copy,
  Check,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  FolderArchive,
  FolderOpen,
  Fingerprint,
} from 'lucide-react'
import {
  createZip,
  inspectZip,
  extractZipEntry,
  extractAllZipEntries,
  calculateTextHash,
  calculateFileHash,
  textToBase64,
  base64ToText,
  fileToBase64,
  base64ToFileBlob,
  type ZipEntryInfo,
} from '../../core/engine/archive/archiveEngine'
import { FileDropZone } from '../../components/upload/FileDropZone'
import { ProgressBar } from '../../components/common/ProgressBar'
import { formatBytes, triggerFileDownload } from '../../services/file/fileUtils'

// ============================================================================
// 1. CREATE ZIP ARCHIVE VIEW
// ============================================================================

export const ZipCreatorView: React.FC = () => {
  const [files, setFiles] = useState<File[]>([])
  const [archiveName, setArchiveName] = useState('archive.zip')
  const [compressionLevel, setCompressionLevel] = useState<number>(6)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null)

  const handleAddFiles = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles])
    setGeneratedBlob(null)
  }

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setGeneratedBlob(null)
  }

  const handleClearAll = () => {
    setFiles([])
    setGeneratedBlob(null)
    setProgress(0)
    setStatus('')
  }

  const handleCreateZip = async () => {
    if (files.length === 0) return

    try {
      setIsProcessing(true)
      setProgress(5)
      setStatus('Initializing archive generator...')

      const compression = compressionLevel === 0 ? 'STORE' : 'DEFLATE'
      const blob = await createZip(
        files,
        {
          compression,
          compressionLevel: compressionLevel === 0 ? undefined : compressionLevel,
        },
        (p, s) => {
          setProgress(p)
          setStatus(s)
        }
      )

      setGeneratedBlob(blob)
    } catch (err: any) {
      alert(`Failed to create ZIP: ${err.message || 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!generatedBlob) return
    const filename = archiveName.trim().endsWith('.zip')
      ? archiveName.trim()
      : `${archiveName.trim() || 'archive'}.zip`
    triggerFileDownload(generatedBlob, filename)
  }

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Dropzone */}
      <FileDropZone
        multiple
        supportsMultipleFiles
        title="Drop multiple files to package into a ZIP archive"
        onFilesSelected={handleAddFiles}
        selectedFiles={files}
        onRemoveFile={handleRemoveFile}
        onClearFiles={handleClearAll}
        disabled={isProcessing}
      />

      {/* 2. Controls & Configuration */}
      {files.length > 0 && !generatedBlob && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            padding: '1.25rem',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                ZIP Filename:
              </label>
              <input
                type="text"
                className="search-input"
                value={archiveName}
                onChange={(e) => setArchiveName(e.target.value)}
                placeholder="archive.zip"
                disabled={isProcessing}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Compression Level:
              </label>
              <select
                className="search-input"
                value={compressionLevel}
                onChange={(e) => setCompressionLevel(parseInt(e.target.value, 10))}
                disabled={isProcessing}
              >
                <option value={6}>Standard DEFLATE (Level 6 - Recommended)</option>
                <option value={9}>Maximum DEFLATE (Level 9 - Best size)</option>
                <option value={1}>Fast DEFLATE (Level 1 - Fast speed)</option>
                <option value={0}>Store (No compression - Instant)</option>
              </select>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              paddingTop: '0.5rem',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <strong>{files.length}</strong> file{files.length === 1 ? '' : 's'} selected ({formatBytes(totalBytes)})
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCreateZip}
              disabled={isProcessing || files.length === 0}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <FolderArchive size={16} />
              {isProcessing ? 'Generating ZIP in Browser...' : 'Generate ZIP Archive'}
            </button>
          </div>
        </div>
      )}

      {/* 3. Progress State */}
      {isProcessing && <ProgressBar progress={progress} statusText={status} />}

      {/* 4. Result / Download Card */}
      {generatedBlob && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            padding: '1.5rem',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--accent-emerald)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={20} color="var(--accent-emerald)" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                  ZIP Archive Ready
                </h3>
              </div>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Archive Size: <strong>{formatBytes(generatedBlob.size)}</strong> (from {formatBytes(totalBytes)} uncompressed)
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={handleClearAll}>
                <RefreshCw size={14} /> New Archive
              </button>
              <button type="button" className="btn btn-primary" onClick={handleDownload}>
                <Download size={15} /> Download {archiveName}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 2. EXTRACT ZIP ARCHIVE VIEW (WITH ZIP SLIP & DANGEROUS FILE PROTECTIONS)
// ============================================================================

export const ZipExtractorView: React.FC = () => {
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [entries, setEntries] = useState<ZipEntryInfo[]>([])
  const [isInspecting, setIsInspecting] = useState(false)
  const [isExtractingAll, setIsExtractingAll] = useState(false)
  const [extractProgress, setExtractProgress] = useState(0)
  const [extractStatus, setExtractStatus] = useState('')
  const [hasDangerousFiles, setHasDangerousFiles] = useState(false)
  const [hasTraversals, setHasTraversals] = useState(false)

  const handleZipSelected = async (files: File[]) => {
    const file = files[0]
    if (!file) return

    setZipFile(file)
    setIsInspecting(true)

    try {
      const list = await inspectZip(file)
      setEntries(list)

      const dangerous = list.some((e) => e.isDangerous)
      const traversals = list.some((e) => e.isTraversalAttempt)
      setHasDangerousFiles(dangerous)
      setHasTraversals(traversals)
    } catch (err: any) {
      alert(`Could not read ZIP archive: ${err.message || 'File may be corrupted or encrypted.'}`)
      setZipFile(null)
    } finally {
      setIsInspecting(false)
    }
  }

  const handleExtractSingle = async (entry: ZipEntryInfo) => {
    if (!zipFile || entry.isDir) return

    if (entry.isDangerous) {
      const confirmed = window.confirm(
        `WARNING: "${entry.name}" has an executable file extension. Extracting may pose security risks if executed on your machine. Do you wish to continue safe download?`
      )
      if (!confirmed) return
    }

    try {
      const { blob, safeFilename } = await extractZipEntry(zipFile, entry.originalName)
      triggerFileDownload(blob, safeFilename)
    } catch (err: any) {
      alert(`Error extracting file: ${err.message}`)
    }
  }

  const handleExtractAll = async () => {
    if (!zipFile) return

    if (hasDangerousFiles) {
      const confirmed = window.confirm(
        'Warning: This archive contains potentially dangerous executable or script files. They will be downloaded safely without execution. Proceed?'
      )
      if (!confirmed) return
    }

    try {
      setIsExtractingAll(true)
      const extracted = await extractAllZipEntries(zipFile, (p, s) => {
        setExtractProgress(p)
        setExtractStatus(s)
      })

      // Download each extracted file safely
      for (const item of extracted) {
        const filename = item.name.split('/').pop() || 'file'
        triggerFileDownload(item.blob, filename)
        // Stagger browser download events slightly to prevent tab throttling
        await new Promise((resolve) => setTimeout(resolve, 150))
      }
    } catch (err: any) {
      alert(`Failed to extract all files: ${err.message}`)
    } finally {
      setIsExtractingAll(false)
    }
  }

  const handleReset = () => {
    setZipFile(null)
    setEntries([])
    setHasDangerousFiles(false)
    setHasTraversals(false)
    setExtractProgress(0)
    setExtractStatus('')
  }

  const totalUncompressed = entries.reduce((acc, e) => acc + (e.isDir ? 0 : e.size), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {!zipFile ? (
        <>
          <FileDropZone
            acceptedTypes={['.zip', 'application/zip', 'application/x-zip-compressed']}
            onFilesSelected={handleZipSelected}
            title="Drop a .ZIP archive to inspect and extract contents safely"
            supportsMultipleFiles={false}
          />
          {isInspecting && (
            <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>
              Reading and sanitizing archive contents in browser...
            </div>
          )}
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Header Summary */}
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
                <FolderOpen size={20} color="var(--accent-primary)" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                  {zipFile.name}
                </h3>
              </div>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {entries.length} items found • Total uncompressed: {formatBytes(totalUncompressed)} • Archive size: {formatBytes(zipFile.size)}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-secondary" onClick={handleReset} disabled={isExtractingAll}>
                <RefreshCw size={14} /> Open Different ZIP
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleExtractAll}
                disabled={isExtractingAll || entries.length === 0}
              >
                <Download size={14} /> Extract All ({entries.filter((e) => !e.isDir).length} files)
              </button>
            </div>
          </div>

          {/* Security Badges / Notices */}
          {hasTraversals && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.85rem 1rem',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--accent-rose, #ef4444)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--accent-rose, #ef4444)',
                fontSize: '0.85rem',
              }}
            >
              <ShieldAlert size={18} />
              <span>
                <strong>Zip Slip Protection Active:</strong> Malicious directory traversal paths (e.g. <code>../</code>) were detected and automatically neutralized to protect your system.
              </span>
            </div>
          )}

          {hasDangerousFiles && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.85rem 1rem',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid var(--accent-amber, #f59e0b)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--accent-amber, #f59e0b)',
                fontSize: '0.85rem',
              }}
            >
              <AlertTriangle size={18} />
              <span>
                <strong>Executable Files Detected:</strong> This archive contains executable/script files. They are never executed in the browser; exercise caution before running downloaded executables.
              </span>
            </div>
          )}

          {isExtractingAll && <ProgressBar progress={extractProgress} statusText={extractStatus} />}

          {/* File Entries Table */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              maxHeight: '460px',
              overflowY: 'auto',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-surface)',
              padding: '0.5rem',
            }}
          >
            {entries.map((entry, idx) => (
              <div
                key={`${entry.name}-${idx}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: entry.isDangerous
                    ? 'rgba(245, 158, 11, 0.08)'
                    : entry.isTraversalAttempt
                    ? 'rgba(239, 68, 68, 0.08)'
                    : 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
                  {entry.isDir ? (
                    <Folder size={16} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                  ) : (
                    <File size={16} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                  )}

                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      wordBreak: 'break-all',
                      color: entry.isDangerous ? 'var(--accent-amber)' : 'var(--text-primary)',
                      fontWeight: entry.isDir ? 600 : 400,
                    }}
                  >
                    {entry.name}
                  </span>

                  {entry.isTraversalAttempt && (
                    <span className="badge badge-rose" style={{ fontSize: '0.7rem' }}>
                      Path Sanitized
                    </span>
                  )}

                  {entry.isDangerous && (
                    <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>
                      Executable
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                  {!entry.isDir && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                      {formatBytes(entry.size)}
                    </span>
                  )}

                  {!entry.isDir && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleExtractSingle(entry)}
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                      title={`Extract ${entry.name}`}
                    >
                      <Download size={13} /> Extract
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 3. CRYPTOGRAPHIC FILE & TEXT HASH GENERATOR (WEB CRYPTO API)
// ============================================================================

export const FileHashView: React.FC = () => {
  const [mode, setMode] = useState<'file' | 'text'>('file')
  const [file, setFile] = useState<File | null>(null)
  const [textInput, setTextInput] = useState('Hello, Web Crypto!')
  const [algorithm, setAlgorithm] = useState<'SHA-256' | 'SHA-512' | 'SHA-1'>('SHA-256')
  const [hashResult, setHashResult] = useState<string>('')
  const [isUppercase, setIsUppercase] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [compareHash, setCompareHash] = useState('')
  const [copied, setCopied] = useState(false)

  // Compute for text
  const computeTextHash = async (text: string, algo: 'SHA-256' | 'SHA-512' | 'SHA-1') => {
    try {
      setIsProcessing(true)
      const digest = await calculateTextHash(text, algo)
      setHashResult(digest)
    } catch (err: any) {
      alert(`Hash error: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // Compute for file
  const computeFileHash = async (targetFile: File, algo: 'SHA-256' | 'SHA-512' | 'SHA-1') => {
    try {
      setIsProcessing(true)
      const digest = await calculateFileHash(targetFile, algo, (p, s) => {
        setProgress(p)
        setStatus(s)
      })
      setHashResult(digest)
    } catch (err: any) {
      alert(`Failed to compute checksum: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAlgorithmChange = (algo: 'SHA-256' | 'SHA-512' | 'SHA-1') => {
    setAlgorithm(algo)
    if (mode === 'file' && file) {
      computeFileHash(file, algo)
    } else if (mode === 'text') {
      computeTextHash(textInput, algo)
    }
  }

  const handleCopy = () => {
    if (!hashResult) return
    const output = isUppercase ? hashResult.toUpperCase() : hashResult.toLowerCase()
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClear = () => {
    setFile(null)
    setTextInput('')
    setHashResult('')
    setCompareHash('')
  }

  const displayedHash = isUppercase ? hashResult.toUpperCase() : hashResult.toLowerCase()
  const isMatch = compareHash.trim()
    ? compareHash.trim().toLowerCase() === hashResult.toLowerCase()
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Mode Switcher */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="button"
          className={`btn ${mode === 'file' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => {
            setMode('file')
            setHashResult('')
          }}
        >
          <File size={15} /> Hash Uploaded File
        </button>
        <button
          type="button"
          className={`btn ${mode === 'text' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => {
            setMode('text')
            computeTextHash(textInput, algorithm)
          }}
        >
          <Fingerprint size={15} /> Hash Plain Text
        </button>
      </div>

      {/* Algorithm Selector with Security Badges */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Select Cryptographic Algorithm (Web Crypto API):
        </label>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {(['SHA-256', 'SHA-512', 'SHA-1'] as const).map((algo) => (
            <button
              key={algo}
              type="button"
              className={`btn ${algorithm === algo ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleAlgorithmChange(algo)}
            >
              {algo}
              {algo === 'SHA-1' && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    color: '#f87171',
                    marginLeft: '0.35rem',
                  }}
                >
                  Legacy
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {algorithm === 'SHA-1' && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid var(--accent-amber)',
            fontSize: '0.825rem',
            color: 'var(--accent-amber)',
          }}
        >
          ⚠️ <strong>Notice:</strong> SHA-1 is cryptographically broken and vulnerable to collision attacks. It is provided strictly for legacy checksum verification. Use <strong>SHA-256</strong> or <strong>SHA-512</strong> for secure integrity validation.
        </div>
      )}

      {/* Mode Specific Input */}
      {mode === 'file' ? (
        !file ? (
          <FileDropZone
            title="Drop any file to calculate cryptographic checksum"
            onFilesSelected={(f) => {
              setFile(f[0])
              computeFileHash(f[0], algorithm)
            }}
            supportsMultipleFiles={false}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.25rem',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <strong>{file.name}</strong> ({formatBytes(file.size)})
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleClear}>
              <RefreshCw size={14} /> New File
            </button>
          </div>
        )
      ) : (
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            Input Text:
          </label>
          <textarea
            className="search-input"
            style={{ height: '110px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
            value={textInput}
            onChange={(e) => {
              setTextInput(e.target.value)
              computeTextHash(e.target.value, algorithm)
            }}
            placeholder="Type or paste text to compute checksum..."
          />
        </div>
      )}

      {isProcessing && <ProgressBar progress={progress} statusText={status} />}

      {/* Output Display Card */}
      {hashResult && !isProcessing && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            padding: '1.5rem',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {algorithm} Hash Digest:
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isUppercase}
                  onChange={(e) => setIsUppercase(e.target.checked)}
                />
                UPPERCASE
              </label>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleCopy}>
                {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleClear}>
                Clear
              </button>
            </div>
          </div>

          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.9rem',
              wordBreak: 'break-all',
              color: 'var(--accent-primary)',
              lineHeight: 1.5,
            }}
          >
            {displayedHash}
          </div>

          {/* Hash Verification / Compare Check */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Compare with expected checksum:
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                className="search-input"
                value={compareHash}
                onChange={(e) => setCompareHash(e.target.value)}
                placeholder="Paste expected hash to verify match..."
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
              />
            </div>

            {compareHash.trim() && (
              <div style={{ marginTop: '0.6rem' }}>
                {isMatch ? (
                  <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ShieldCheck size={14} /> Checksums Match Perfectly (100% Verified)
                  </span>
                ) : (
                  <span className="badge badge-rose" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ShieldAlert size={14} /> Checksums Do NOT Match (Corrupted or Altered)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 4. BASE64 ENCODER VIEW
// ============================================================================

export const Base64EncoderView: React.FC = () => {
  const [mode, setMode] = useState<'text' | 'file'>('text')
  const [textInput, setTextInput] = useState('MicroTools — 100% In-Browser Utilities 🚀')
  const [encodedOutput, setEncodedOutput] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [includeDataUri, setIncludeDataUri] = useState(true)
  const [isLargeFile, setIsLargeFile] = useState(false)
  const [copied, setCopied] = useState(false)

  // Encode Text
  const handleEncodeText = (val: string) => {
    setTextInput(val)
    if (!val) {
      setEncodedOutput('')
      return
    }
    try {
      const b64 = textToBase64(val)
      setEncodedOutput(b64)
    } catch {
      setEncodedOutput('')
    }
  }

  // Encode File
  const handleFileSelected = async (files: File[]) => {
    const f = files[0]
    if (!f) return

    setFile(f)
    if (f.size > 15 * 1024 * 1024) {
      setIsLargeFile(true)
    } else {
      setIsLargeFile(false)
    }

    try {
      const result = await fileToBase64(f, includeDataUri)
      setEncodedOutput(result)
    } catch (err: any) {
      alert(`Failed to encode file: ${err.message}`)
    }
  }

  const handleDownload = () => {
    if (!encodedOutput) return
    const blob = new Blob([encodedOutput], { type: 'text/plain;charset=utf-8' })
    const filename = file ? `${file.name}.base64.txt` : 'encoded_base64.txt'
    triggerFileDownload(blob, filename)
  }

  const handleCopy = () => {
    if (!encodedOutput) return
    navigator.clipboard.writeText(encodedOutput)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Mode Selector */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="button"
          className={`btn ${mode === 'text' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => {
            setMode('text')
            handleEncodeText(textInput)
          }}
        >
          Text → Base64
        </button>
        <button
          type="button"
          className={`btn ${mode === 'file' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => {
            setMode('file')
            setEncodedOutput('')
          }}
        >
          Binary File → Base64
        </button>
      </div>

      {mode === 'text' ? (
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            Text to Encode (UTF-8 / Unicode Safe):
          </label>
          <textarea
            className="search-input"
            style={{ height: '120px' }}
            value={textInput}
            onChange={(e) => handleEncodeText(e.target.value)}
            placeholder="Enter text to encode into Base64..."
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <FileDropZone
            title="Drop any image, PDF, or binary file to encode to Base64"
            onFilesSelected={handleFileSelected}
            supportsMultipleFiles={false}
          />

          {isLargeFile && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid var(--accent-amber)',
                fontSize: '0.85rem',
                color: 'var(--accent-amber)',
              }}
            >
              ⚠️ <strong>Memory Notice:</strong> Files larger than 15MB expand by ~33% when represented as Base64 strings. High string memory in browser tabs may cause sluggishness.
            </div>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={includeDataUri}
              onChange={async (e) => {
                setIncludeDataUri(e.target.checked)
                if (file) {
                  const b64 = await fileToBase64(file, e.target.checked)
                  setEncodedOutput(b64)
                }
              }}
            />
            Include Data URI prefix (e.g. <code>data:image/png;base64,...</code>)
          </label>
        </div>
      )}

      {/* Output */}
      {encodedOutput && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              Encoded Base64 Output ({formatBytes(new TextEncoder().encode(encodedOutput).byteLength)}):
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleCopy}>
                {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleDownload}>
                <Download size={14} /> Download as .txt
              </button>
            </div>
          </div>

          <textarea
            readOnly
            className="search-input"
            style={{ height: '180px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', wordBreak: 'break-all' }}
            value={encodedOutput}
          />
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 5. BASE64 DECODER VIEW
// ============================================================================

export const Base64DecoderView: React.FC = () => {
  const [mode, setMode] = useState<'text' | 'file'>('text')
  const [inputBase64, setInputBase64] = useState('TWljcm9Ub29scyDigJQgMTAwJSBJbi1Ccm93c2VyIFV0aWxpdGllcyDwn5mp')
  const [decodedText, setDecodedText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [decodedFileInfo, setDecodedFileInfo] = useState<{
    blob: Blob
    mimeType: string
    suggestedExtension: string
  } | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleDecodeText = (val: string) => {
    setInputBase64(val)
    setError(null)
    if (!val.trim()) {
      setDecodedText('')
      return
    }

    try {
      const decoded = base64ToText(val)
      setDecodedText(decoded)
    } catch (err: any) {
      setError(err.message || 'Invalid Base64 string.')
      setDecodedText('')
    }
  }

  const handleDecodeFile = (val: string) => {
    setInputBase64(val)
    setError(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setDecodedFileInfo(null)

    if (!val.trim()) return

    try {
      const fileResult = base64ToFileBlob(val)
      setDecodedFileInfo(fileResult)

      if (fileResult.mimeType.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(fileResult.blob))
      }
    } catch (err: any) {
      setError(err.message || 'Failed to decode Base64 file.')
    }
  }

  const handleDownloadFile = () => {
    if (!decodedFileInfo) return
    triggerFileDownload(decodedFileInfo.blob, `decoded_file.${decodedFileInfo.suggestedExtension}`)
  }

  const handleCopy = () => {
    if (!decodedText) return
    navigator.clipboard.writeText(decodedText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Mode Selector */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="button"
          className={`btn ${mode === 'text' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => {
            setMode('text')
            handleDecodeText(inputBase64)
          }}
        >
          Base64 → Text
        </button>
        <button
          type="button"
          className={`btn ${mode === 'file' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => {
            setMode('file')
            handleDecodeFile(inputBase64)
          }}
        >
          Base64 → Binary File
        </button>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
          Paste Base64 or Data URI string:
        </label>
        <textarea
          className="search-input"
          style={{ height: '140px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
          value={inputBase64}
          onChange={(e) => {
            if (mode === 'text') {
              handleDecodeText(e.target.value)
            } else {
              handleDecodeFile(e.target.value)
            }
          }}
          placeholder={mode === 'text' ? 'Paste Base64 encoded string...' : 'Paste data:image/png;base64,... or raw Base64'}
        />
      </div>

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

      {mode === 'text' && decodedText && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Decoded Text:</span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleCopy}>
              {copied ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <textarea
            readOnly
            className="search-input"
            style={{ height: '160px' }}
            value={decodedText}
          />
        </div>
      )}

      {mode === 'file' && decodedFileInfo && !error && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            padding: '1.25rem',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Detected File:</span>
            <div style={{ marginTop: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Type: <code>{decodedFileInfo.mimeType}</code> • Size: {formatBytes(decodedFileInfo.blob.size)}
            </div>
          </div>

          {previewUrl && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
              <img
                src={previewUrl}
                alt="Decoded Preview"
                style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '4px' }}
              />
            </div>
          )}

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleDownloadFile}
            style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Download size={15} /> Download Decoded File (.{decodedFileInfo.suggestedExtension})
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 6. BACKWARD-COMPATIBLE BASE64 COMPOSITE VIEW
// ============================================================================

export const Base64View: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'encode' | 'decode'>('encode')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
        <button
          type="button"
          className={`btn ${activeTab === 'encode' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('encode')}
        >
          Base64 Encoder
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'decode' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('decode')}
        >
          Base64 Decoder
        </button>
      </div>

      {activeTab === 'encode' ? <Base64EncoderView /> : <Base64DecoderView />}
    </div>
  )
}
