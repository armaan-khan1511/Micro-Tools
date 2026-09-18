import React, { useState } from 'react'
import { DropZone } from '../../components/common/DropZone'
import { ProgressBar } from '../../components/common/ProgressBar'
import { ActionButtons } from '../../components/common/ActionButtons'
import {
  mergePdfs,
  splitPdf,
  imagesToPdf,
  rotatePdf,
  inspectPdf,
} from '../../core/engine/pdf/pdfEngine'
import { ArrowUp, ArrowDown, RotateCw } from 'lucide-react'

// --- 1. MERGE PDF ---
export const PdfMergeView: React.FC = () => {
  const [files, setFiles] = useState<File[]>([])
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleMerge = async () => {
    try {
      setError(null)
      setIsProcessing(true)
      const bytes = await mergePdfs(files, (p, s) => {
        setProgress(p)
        setStatus(s)
      })
      const blob = new Blob([bytes as any], { type: 'application/pdf' })
      setDownloadUrl(URL.createObjectURL(blob))
    } catch (err: any) {
      setError(err.message || 'Failed to merge PDF files.')
    } finally {
      setIsProcessing(false)
    }
  }

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const newFiles = [...files]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newFiles.length) return
    const temp = newFiles[index]
    newFiles[index] = newFiles[targetIndex]
    newFiles[targetIndex] = temp
    setFiles(newFiles)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <DropZone
        accepts={['.pdf', 'application/pdf']}
        multiple
        selectedFiles={files}
        onFilesSelected={(newFiles) => setFiles((prev) => [...prev, ...newFiles])}
        onRemoveFile={(idx) => setFiles(files.filter((_, i) => i !== idx))}
        title="Drop 2 or more PDF files to merge"
      />

      {files.length > 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Merge Order (drag or reorder):
          </div>
          {files.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.85rem',
              }}
            >
              <span>{idx + 1}. {file.name}</span>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => moveFile(idx, 'up')}
                  disabled={idx === 0}
                  className="btn-icon"
                  style={{ padding: '0.2rem' }}
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => moveFile(idx, 'down')}
                  disabled={idx === files.length - 1}
                  className="btn-icon"
                  style={{ padding: '0.2rem' }}
                >
                  <ArrowDown size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isProcessing && <ProgressBar progress={progress} statusText={status} />}
      {error && <div style={{ color: 'var(--accent-rose)', fontSize: '0.85rem' }}>{error}</div>}

      <ActionButtons
        onProcess={handleMerge}
        isProcessing={isProcessing}
        processLabel="Merge PDFs"
        canProcess={files.length >= 2}
        downloadUrl={downloadUrl}
        downloadFilename="merged_document.pdf"
        onReset={() => {
          setFiles([])
          setDownloadUrl(null)
          setProgress(0)
        }}
      />
    </div>
  )
}

// --- 2. SPLIT PDF ---
export const PdfSplitView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [ranges, setRanges] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (files: File[]) => {
    if (!files[0]) return
    setFile(files[0])
    setDownloadUrl(null)
    setError(null)
    try {
      const info = await inspectPdf(files[0])
      setPageCount(info.pageCount)
      setRanges(`1-${Math.min(3, info.pageCount)}`)
    } catch (e: any) {
      setError('Could not inspect PDF pages.')
    }
  }

  const handleSplit = async () => {
    if (!file) return
    try {
      setError(null)
      setIsProcessing(true)
      const bytes = await splitPdf(file, ranges, (p, s) => {
        setProgress(p)
        setStatus(s)
      })
      const blob = new Blob([bytes as any], { type: 'application/pdf' })
      setDownloadUrl(URL.createObjectURL(blob))
    } catch (err: any) {
      setError(err.message || 'Failed to split PDF.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {!file ? (
        <DropZone
          accepts={['.pdf', 'application/pdf']}
          onFilesSelected={handleFile}
          title="Drop PDF file to extract pages"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <strong>{file.name}</strong> ({pageCount} total pages)
            </div>
            <button type="button" className="btn btn-secondary" onClick={() => setFile(null)}>Change File</button>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
              Page Ranges to Extract:
            </label>
            <input
              type="text"
              className="search-input"
              style={{ paddingLeft: '1rem' }}
              value={ranges}
              onChange={(e) => setRanges(e.target.value)}
              placeholder="e.g. 1-3, 5, 7-9"
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Example: "1-2, 4" will create a PDF containing page 1, 2, and 4.
            </span>
          </div>

          {isProcessing && <ProgressBar progress={progress} statusText={status} />}
          {error && <div style={{ color: 'var(--accent-rose)', fontSize: '0.85rem' }}>{error}</div>}

          <ActionButtons
            onProcess={handleSplit}
            isProcessing={isProcessing}
            processLabel="Extract Selected Pages"
            canProcess={!!ranges.trim()}
            downloadUrl={downloadUrl}
            downloadFilename={`extracted_pages_${ranges.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`}
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

// --- 3. IMAGES TO PDF ---
export const ImagesToPdfView: React.FC = () => {
  const [images, setImages] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleConvert = async () => {
    try {
      setError(null)
      setIsProcessing(true)
      const bytes = await imagesToPdf(images, (p, s) => {
        setProgress(p)
        setStatus(s)
      })
      const blob = new Blob([bytes as any], { type: 'application/pdf' })
      setDownloadUrl(URL.createObjectURL(blob))
    } catch (err: any) {
      setError(err.message || 'Failed to convert images to PDF.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <DropZone
        accepts={['image/jpeg', 'image/png', 'image/webp', '.jpg', '.png', '.webp']}
        multiple
        selectedFiles={images}
        onFilesSelected={(newFiles) => setImages((prev) => [...prev, ...newFiles])}
        onRemoveFile={(idx) => setImages(images.filter((_, i) => i !== idx))}
        title="Drop JPG, PNG, or WebP images to combine into PDF"
      />

      {isProcessing && <ProgressBar progress={progress} statusText={status} />}
      {error && <div style={{ color: 'var(--accent-rose)', fontSize: '0.85rem' }}>{error}</div>}

      <ActionButtons
        onProcess={handleConvert}
        isProcessing={isProcessing}
        processLabel="Generate PDF"
        canProcess={images.length > 0}
        downloadUrl={downloadUrl}
        downloadFilename="images_document.pdf"
        onReset={() => {
          setImages([])
          setDownloadUrl(null)
        }}
      />
    </div>
  )
}

// --- 4. ROTATE PDF ---
export const PdfRotateView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [angle, setAngle] = useState(90)
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRotate = async () => {
    if (!file) return
    try {
      setError(null)
      setIsProcessing(true)
      const bytes = await rotatePdf(file, angle)
      const blob = new Blob([bytes as any], { type: 'application/pdf' })
      setDownloadUrl(URL.createObjectURL(blob))
    } catch (err: any) {
      setError(err.message || 'Failed to rotate PDF.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {!file ? (
        <DropZone
          accepts={['.pdf', 'application/pdf']}
          onFilesSelected={(f) => setFile(f[0])}
          title="Drop PDF to rotate pages"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
            <strong>{file.name}</strong>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              Rotation Angle:
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[90, 180, 270].map((deg) => (
                <button
                  key={deg}
                  type="button"
                  className={`btn ${angle === deg ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setAngle(deg)}
                >
                  <RotateCw size={14} /> +{deg}°
                </button>
              ))}
            </div>
          </div>

          {error && <div style={{ color: 'var(--accent-rose)', fontSize: '0.85rem' }}>{error}</div>}

          <ActionButtons
            onProcess={handleRotate}
            isProcessing={isProcessing}
            processLabel={`Rotate PDF (${angle}°)`}
            downloadUrl={downloadUrl}
            downloadFilename={`rotated_${angle}deg_${file.name}`}
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
