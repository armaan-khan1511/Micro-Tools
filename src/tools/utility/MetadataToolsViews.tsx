import React, { useState } from 'react'
import {
  FileText,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Download,
  RefreshCw,
} from 'lucide-react'
import {
  inspectFileMetadata,
  type FileMetadataResult,
} from '../../core/engine/archive/archiveEngine'
import { FileDropZone } from '../../components/upload/FileDropZone'
import { triggerFileDownload } from '../../services/file/fileUtils'

export const FileMetadataView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [metadata, setMetadata] = useState<FileMetadataResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [copiedJson, setCopiedJson] = useState(false)
  const [copiedHash, setCopiedHash] = useState(false)

  const handleFileSelected = async (files: File[]) => {
    const f = files[0]
    if (!f) return

    setFile(f)
    setIsProcessing(true)

    try {
      const meta = await inspectFileMetadata(f)
      setMetadata(meta)
    } catch (err: any) {
      alert(`Error reading file metadata: ${err.message || 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setMetadata(null)
  }

  const handleCopyJson = () => {
    if (!metadata) return
    navigator.clipboard.writeText(JSON.stringify(metadata, null, 2))
    setCopiedJson(true)
    setTimeout(() => setCopiedJson(false), 2000)
  }

  const handleCopyHash = () => {
    if (!metadata) return
    navigator.clipboard.writeText(metadata.sha256Hash)
    setCopiedHash(true)
    setTimeout(() => setCopiedHash(false), 2000)
  }

  const handleDownloadReport = () => {
    if (!metadata) return
    const reportText = `MicroTools — File Metadata Inspection Report
==================================================
File Name:          ${metadata.fileName}
File Extension:     .${metadata.fileExtension}
File Size:          ${metadata.formattedSize} (${metadata.fileSizeBytes.toLocaleString()} bytes)
MIME Type:          ${metadata.mimeType}
Last Modified:      ${metadata.lastModifiedDate}
Detected Format:    ${metadata.detectedFormat}
Signature Matched:  ${metadata.signatureMatched ? 'YES (Valid)' : 'NO (Extension / Signature Mismatch)'}
SHA-256 Checksum:   ${metadata.sha256Hash}

Magic Bytes (Hex):
${metadata.magicBytesHex}

Magic Bytes (ASCII):
${metadata.magicBytesAscii}

Specific Details:
${Object.entries(metadata.details)
  .map(([k, v]) => `• ${k}: ${v}`)
  .join('\n')}

==================================================
Generated 100% Client-Side via Web Crypto & HTML5 APIs
`
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' })
    triggerFileDownload(blob, `${metadata.fileName}_metadata_report.txt`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {!file ? (
        <FileDropZone
          title="Drop any image, document, archive, or binary file to inspect metadata"
          onFilesSelected={handleFileSelected}
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
                <FileText size={20} color="var(--accent-primary)" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                  {file.name}
                </h3>
              </div>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {metadata?.formattedSize} • {metadata?.mimeType}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleReset}>
                <RefreshCw size={14} /> Inspect New File
              </button>
              {metadata && (
                <>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleCopyJson}>
                    {copiedJson ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                    {copiedJson ? 'JSON Copied' : 'Copy JSON'}
                  </button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={handleDownloadReport}>
                    <Download size={14} /> Download Report
                  </button>
                </>
              )}
            </div>
          </div>

          {isProcessing && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
              Analyzing file headers, computing checksum, and parsing format metadata in browser...
            </div>
          )}

          {metadata && !isProcessing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Signature Integrity Warning / Confirmation */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.85rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: metadata.signatureMatched
                    ? 'rgba(16, 185, 129, 0.08)'
                    : 'rgba(239, 68, 68, 0.08)',
                  border: `1px solid ${
                    metadata.signatureMatched ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                  }`,
                  fontSize: '0.85rem',
                }}
              >
                {metadata.signatureMatched ? (
                  <>
                    <ShieldCheck size={18} color="var(--accent-emerald)" />
                    <span>
                      <strong>Format Verified:</strong> Magic bytes match declared extension (
                      <code>.{metadata.fileExtension}</code> → <strong>{metadata.detectedFormat}</strong>).
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldAlert size={18} color="var(--accent-rose)" />
                    <span>
                      <strong>File Signature Mismatch:</strong> File extension is <code>.{metadata.fileExtension}</code>, but internal magic byte header indicates <strong>{metadata.detectedFormat}</strong>. This may indicate a renamed or spoofed file.
                    </span>
                  </>
                )}
              </div>

              {/* General Properties Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Exact Size</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                    {metadata.fileSizeBytes.toLocaleString()} bytes
                  </div>
                </div>

                <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>MIME Type</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                    {metadata.mimeType}
                  </div>
                </div>

                <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last Modified Date</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.2rem' }}>
                    {metadata.lastModifiedDate}
                  </div>
                </div>

                <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Detected Format</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.2rem', color: 'var(--accent-primary)' }}>
                    {metadata.detectedFormat}
                  </div>
                </div>
              </div>

              {/* SHA-256 Checksum Card */}
              <div
                style={{
                  padding: '1rem 1.25rem',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    SHA-256 Cryptographic Hash:
                  </span>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleCopyHash}>
                    {copiedHash ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
                    {copiedHash ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    color: 'var(--accent-primary)',
                    wordBreak: 'break-all',
                    backgroundColor: 'var(--bg-secondary)',
                    padding: '0.6rem 0.8rem',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {metadata.sha256Hash}
                </div>
              </div>

              {/* Format-Specific Details Card (if any) */}
              {Object.keys(metadata.details).length > 0 && (
                <div
                  style={{
                    padding: '1.25rem',
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <h4 style={{ margin: '0 0 0.85rem', fontSize: '0.95rem', fontWeight: 700 }}>
                    Format-Specific Attributes:
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.6rem' }}>
                    {Object.entries(metadata.details).map(([key, val]) => (
                      <div
                        key={key}
                        style={{
                          padding: '0.6rem 0.8rem',
                          backgroundColor: 'var(--bg-secondary)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.85rem',
                        }}
                      >
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>
                          {key}
                        </span>
                        <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                          {String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Magic Bytes Hex & ASCII Dump */}
              <div
                style={{
                  padding: '1.25rem',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', fontWeight: 700 }}>
                  Magic Bytes Inspection (First 32 Bytes):
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                      Hexadecimal Representation:
                    </span>
                    <pre
                      style={{
                        margin: 0,
                        padding: '0.75rem',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-sm)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8rem',
                        color: 'var(--accent-primary)',
                        overflowX: 'auto',
                      }}
                    >
                      {metadata.magicBytesHex}
                    </pre>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                      ASCII Representation:
                    </span>
                    <pre
                      style={{
                        margin: 0,
                        padding: '0.75rem',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-sm)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8rem',
                        color: 'var(--text-primary)',
                        overflowX: 'auto',
                      }}
                    >
                      {metadata.magicBytesAscii}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
