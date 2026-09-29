import React, { useState, useEffect } from 'react'
import JSZip from 'jszip'
import {
  ArrowUp,
  ArrowDown,
  RotateCw,
  AlertCircle,
  ShieldAlert,
  Info,
  ExternalLink,
} from 'lucide-react'
import {
  mergePdfs,
  splitPdf,
  extractPdfPages,
  rotatePdf,
  imagesToPdf,
  renderPdfPagesToImages,
  extractPdfTextContent,
  compressPdfDocument,
  watermarkPdf,
  unlockPdf,
  inspectPdf,
  extractPdfTabularData,
} from '../../core/engine/pdf/pdfEngine'
import { pdfToDocx } from '../../core/engine/document/documentEngine'
import { tabularDataToExcelBlob } from '../../core/engine/document/spreadsheetEngine'
import { useFileProcessor } from '../../hooks/useFileProcessor'
import { ToolWorkspace } from '../../components/framework/ToolWorkspace'
import { formatBytes } from '../../services/file/fileUtils'

// ============================================================================
// 1. MERGE PDF VIEW
// ============================================================================
export const PdfMergeView: React.FC = () => {
  const processor = useFileProcessor({
    acceptedTypes: ['.pdf', 'application/pdf'],
    supportsMultipleFiles: true,
    minFiles: 2,
    maxSizeMb: 100,
  })

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const newFiles = [...processor.files]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newFiles.length) return
    const temp = newFiles[index]
    newFiles[index] = newFiles[targetIndex]
    newFiles[targetIndex] = temp
    processor.setFiles(newFiles)
  }

  const handleMerge = () => {
    processor.startProcessing({}, {
      validate: (files) => {
        if (files.length < 2) {
          return { valid: false, error: 'Please select at least two PDF documents to merge.' }
        }
        return { valid: true }
      },
      process: async (files, _opts, onProgress, signal) => {
        if (signal?.aborted) throw new DOMException('Operation aborted', 'AbortError')
        const bytes = await mergePdfs(files, (p, s) => {
          onProgress({ percentage: p, isIndeterminate: false, stage: s })
        })
        const blob = new Blob([bytes as any], { type: 'application/pdf' })
        return {
          blob,
          downloadName: 'merged-document.pdf',
          mimeType: 'application/pdf',
          sizeBytes: blob.size,
        }
      },
    })
  }

  const reorderOptions = processor.files.length > 1 && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
        Merge Order (drag or use arrows to adjust sequence):
      </div>
      {processor.files.map((file, idx) => (
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
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <strong>{idx + 1}.</strong> {file.name} ({formatBytes(file.size)})
          </span>
          <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => moveFile(idx, 'up')}
              disabled={idx === 0}
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.2rem 0.45rem' }}
              title="Move up"
            >
              <ArrowUp size={14} />
            </button>
            <button
              type="button"
              onClick={() => moveFile(idx, 'down')}
              disabled={idx === processor.files.length - 1}
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.2rem 0.45rem' }}
              title="Move down"
            >
              <ArrowDown size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <ToolWorkspace
      processor={processor}
      acceptedTypes={['.pdf', 'application/pdf']}
      supportsMultipleFiles={true}
      minFiles={2}
      maxSizeMb={100}
      dropzoneTitle="Drop 2 or more PDF files to combine into a single document"
      actionLabel="Merge PDFs"
      onExecute={handleMerge}
      options={reorderOptions}
      resultTitle="PDFs Merged Successfully"
    />
  )
}

// ============================================================================
// 2. SPLIT PDF VIEW (BY RANGES)
// ============================================================================
export const PdfSplitView: React.FC = () => {
  const processor = useFileProcessor({
    acceptedTypes: ['.pdf', 'application/pdf'],
    supportsMultipleFiles: false,
    maxSizeMb: 100,
  })

  const [pageCount, setPageCount] = useState<number | null>(null)
  const [pageRangeStr, setPageRangeStr] = useState('')

  // Automatically inspect pages when a file is selected
  useEffect(() => {
    let isSubscribed = true
    if (processor.files.length > 0) {
      inspectPdf(processor.files[0])
        .then((info) => {
          if (!isSubscribed) return
          setPageCount(info.pageCount)
          setPageRangeStr((prev) => (prev ? prev : info.pageCount > 1 ? `1-${Math.min(3, info.pageCount)}` : '1'))
        })
        .catch(() => {
          if (isSubscribed) setPageCount(null)
        })
    } else {
      setPageCount(null)
      setPageRangeStr('')
    }
    return () => {
      isSubscribed = false
    }
  }, [processor.files])

  const handleSplit = () => {
    processor.startProcessing({}, {
      validate: (files) => {
        if (!files[0]) return { valid: false, error: 'Please choose a PDF file.' }
        if (!pageRangeStr.trim()) return { valid: false, error: 'Please enter a page range (e.g. 1-3, 5).' }
        return { valid: true }
      },
      process: async (files, _opts, onProgress, signal) => {
        if (signal?.aborted) throw new DOMException('Operation aborted', 'AbortError')
        const bytes = await splitPdf(files[0], pageRangeStr.trim(), (p, s) => {
          onProgress({ percentage: p, isIndeterminate: false, stage: s })
        })
        const blob = new Blob([bytes as any], { type: 'application/pdf' })
        const baseName = files[0].name.replace(/\.[^/.]+$/, '')
        const cleanRange = pageRangeStr.replace(/[^a-zA-Z0-9-]/g, '_')
        return {
          blob,
          downloadName: `${baseName}_pages_${cleanRange}.pdf`,
          mimeType: 'application/pdf',
          sizeBytes: blob.size,
        }
      },
    })
  }

  const splitOptions = processor.files.length > 0 && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {pageCount !== null && (
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Document total: <strong>{pageCount}</strong> page{pageCount === 1 ? '' : 's'}
        </div>
      )}
      <div>
        <label
          htmlFor="split-range-input"
          style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}
        >
          Page Ranges to Extract:
        </label>
        <input
          id="split-range-input"
          type="text"
          className="search-input"
          style={{ width: '100%', padding: '0.65rem 0.85rem' }}
          value={pageRangeStr}
          onChange={(e) => setPageRangeStr(e.target.value)}
          placeholder="e.g. 1-3, 5, 8-10"
        />
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
          Separate individual pages or ranges with commas. Example: "1-2, 4" extracts pages 1, 2, and 4.
        </div>
      </div>
    </div>
  )

  return (
    <ToolWorkspace
      processor={processor}
      acceptedTypes={['.pdf', 'application/pdf']}
      supportsMultipleFiles={false}
      maxSizeMb={100}
      dropzoneTitle="Drop a PDF document to split into page ranges"
      actionLabel="Extract Pages"
      onExecute={handleSplit}
      options={splitOptions}
      resultTitle="Selected Pages Extracted"
    />
  )
}

// ============================================================================
// 3. EXTRACT PDF PAGES VIEW (VISUAL CHECKBOX PICKER)
// ============================================================================
export const PdfExtractPagesView: React.FC = () => {
  const processor = useFileProcessor({
    acceptedTypes: ['.pdf', 'application/pdf'],
    supportsMultipleFiles: false,
    maxSizeMb: 100,
  })

  const [pageCount, setPageCount] = useState<number | null>(null)
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())

  useEffect(() => {
    let isSubscribed = true
    if (processor.files.length > 0) {
      inspectPdf(processor.files[0])
        .then((info) => {
          if (!isSubscribed) return
          setPageCount(info.pageCount)
          // Default: select first page
          setSelectedIndices(new Set([0]))
        })
        .catch(() => {
          if (!isSubscribed) return
          setPageCount(null)
          setSelectedIndices(new Set())
        })
    } else {
      setPageCount(null)
      setSelectedIndices(new Set())
    }
    return () => {
      isSubscribed = false
    }
  }, [processor.files])

  const togglePage = (index: number) => {
    const next = new Set(selectedIndices)
    if (next.has(index)) next.delete(index)
    else next.add(index)
    setSelectedIndices(next)
  }

  const selectAll = () => {
    if (!pageCount) return
    setSelectedIndices(new Set(Array.from({ length: pageCount }, (_, i) => i)))
  }

  const deselectAll = () => setSelectedIndices(new Set())

  const selectOdd = () => {
    if (!pageCount) return
    setSelectedIndices(new Set(Array.from({ length: pageCount }, (_, i) => i).filter((i) => i % 2 === 0)))
  }

  const selectEven = () => {
    if (!pageCount) return
    setSelectedIndices(new Set(Array.from({ length: pageCount }, (_, i) => i).filter((i) => i % 2 !== 0)))
  }

  const handleExtract = () => {
    processor.startProcessing({}, {
      validate: (files) => {
        if (!files[0]) return { valid: false, error: 'Please choose a PDF file.' }
        if (selectedIndices.size === 0) return { valid: false, error: 'Please select at least one page to extract.' }
        return { valid: true }
      },
      process: async (files, _opts, onProgress, signal) => {
        if (signal?.aborted) throw new DOMException('Operation aborted', 'AbortError')
        const sorted = Array.from(selectedIndices).sort((a, b) => a - b)
        const bytes = await extractPdfPages(files[0], sorted, (p, s) => {
          onProgress({ percentage: p, isIndeterminate: false, stage: s })
        })
        const blob = new Blob([bytes as any], { type: 'application/pdf' })
        const baseName = files[0].name.replace(/\.[^/.]+$/, '')
        return {
          blob,
          downloadName: `${baseName}_extracted_${sorted.length}pages.pdf`,
          mimeType: 'application/pdf',
          sizeBytes: blob.size,
        }
      },
    })
  }

  const pagePickerOptions = processor.files.length > 0 && pageCount !== null && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Select Pages ({selectedIndices.size} of {pageCount} selected):
        </span>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={selectAll}>All</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={deselectAll}>None</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={selectOdd}>Odd</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={selectEven}>Even</button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))',
          gap: '0.45rem',
          maxHeight: '220px',
          overflowY: 'auto',
          padding: '0.5rem',
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {Array.from({ length: pageCount }, (_, i) => {
          const isSelected = selectedIndices.has(i)
          return (
            <button
              key={i}
              type="button"
              onClick={() => togglePage(i)}
              style={{
                padding: '0.6rem 0.25rem',
                borderRadius: 'var(--radius-sm)',
                border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-surface)',
                color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                fontWeight: isSelected ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              Pg {i + 1}
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <ToolWorkspace
      processor={processor}
      acceptedTypes={['.pdf', 'application/pdf']}
      supportsMultipleFiles={false}
      maxSizeMb={100}
      dropzoneTitle="Drop PDF document to select and extract individual pages"
      actionLabel={`Extract ${selectedIndices.size} Selected Page${selectedIndices.size === 1 ? '' : 's'}`}
      onExecute={handleExtract}
      options={pagePickerOptions}
      resultTitle="Pages Extracted Successfully"
    />
  )
}

// ============================================================================
// 4. ROTATE PDF VIEW
// ============================================================================
export const PdfRotateView: React.FC = () => {
  const processor = useFileProcessor({
    acceptedTypes: ['.pdf', 'application/pdf'],
    supportsMultipleFiles: false,
    maxSizeMb: 100,
  })

  const [angle, setAngle] = useState(90)
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [rotateMode, setRotateMode] = useState<'all' | 'custom'>('all')
  const [customRange, setCustomRange] = useState('')

  useEffect(() => {
    let isSubscribed = true
    if (processor.files.length > 0) {
      inspectPdf(processor.files[0])
        .then((info) => {
          if (isSubscribed) setPageCount(info.pageCount)
        })
        .catch(() => {
          if (isSubscribed) setPageCount(null)
        })
    } else {
      setPageCount(null)
    }
    return () => {
      isSubscribed = false
    }
  }, [processor.files])

  const handleRotate = () => {
    processor.startProcessing({}, {
      validate: (files) => {
        if (!files[0]) return { valid: false, error: 'Please choose a PDF document.' }
        return { valid: true }
      },
      process: async (files, _opts, onProgress, signal) => {
        if (signal?.aborted) throw new DOMException('Operation aborted', 'AbortError')

        let targetIndices: number[] | undefined = undefined
        if (rotateMode === 'custom' && customRange.trim() && pageCount) {
          const parts = customRange.split(',').map((p) => p.trim())
          const indices = new Set<number>()
          for (const part of parts) {
            if (part.includes('-')) {
              const [start, end] = part.split('-').map((n) => parseInt(n, 10))
              if (!isNaN(start) && !isNaN(end)) {
                for (let p = Math.max(1, start); p <= Math.min(pageCount, end); p++) {
                  indices.add(p - 1)
                }
              }
            } else {
              const p = parseInt(part, 10)
              if (!isNaN(p) && p >= 1 && p <= pageCount) indices.add(p - 1)
            }
          }
          targetIndices = Array.from(indices)
        }

        const bytes = await rotatePdf(files[0], angle, targetIndices, (p, s) => {
          onProgress({ percentage: p, isIndeterminate: false, stage: s })
        })
        const blob = new Blob([bytes as any], { type: 'application/pdf' })
        const baseName = files[0].name.replace(/\.[^/.]+$/, '')
        return {
          blob,
          downloadName: `${baseName}_rotated_${angle}deg.pdf`,
          mimeType: 'application/pdf',
          sizeBytes: blob.size,
        }
      },
    })
  }

  const rotateOptions = processor.files.length > 0 && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <RotateCw size={14} /> +{deg}° Clockwise
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
          Pages to Rotate:
        </label>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input
              type="radio"
              name="rotate-scope"
              checked={rotateMode === 'all'}
              onChange={() => setRotateMode('all')}
            />
            All Pages {pageCount ? `(${pageCount} total)` : ''}
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', cursor: 'pointer' }}>
            <input
              type="radio"
              name="rotate-scope"
              checked={rotateMode === 'custom'}
              onChange={() => setRotateMode('custom')}
            />
            Specific Pages / Ranges
          </label>
        </div>

        {rotateMode === 'custom' && (
          <input
            type="text"
            className="search-input"
            style={{ width: '100%', padding: '0.6rem 0.85rem' }}
            value={customRange}
            onChange={(e) => setCustomRange(e.target.value)}
            placeholder="e.g. 1, 3, 5-7"
          />
        )}
      </div>
    </div>
  )

  return (
    <ToolWorkspace
      processor={processor}
      acceptedTypes={['.pdf', 'application/pdf']}
      supportsMultipleFiles={false}
      maxSizeMb={100}
      dropzoneTitle="Drop PDF document to orient and rotate pages"
      actionLabel={`Rotate PDF (+${angle}°)`}
      onExecute={handleRotate}
      options={rotateOptions}
      resultTitle="PDF Rotated Successfully"
    />
  )
}

// ============================================================================
// 5. IMAGES TO PDF VIEW (JPG/PNG/WEBP TO PDF)
// ============================================================================
export const ImagesToPdfView: React.FC<{ defaultFormat?: 'jpg' | 'png' }> = () => {
  const processor = useFileProcessor({
    acceptedTypes: ['.jpg', '.jpeg', '.png', '.webp', 'image/*'],
    supportsMultipleFiles: true,
    minFiles: 1,
    maxSizeMb: 60,
  })

  const [rotations, setRotations] = useState<number[]>([])

  useEffect(() => {
    setRotations((prev) => {
      const next = [...prev]
      while (next.length < processor.files.length) next.push(0)
      return next.slice(0, processor.files.length)
    })
  }, [processor.files.length])

  const rotateImageItem = (index: number) => {
    setRotations((prev) => {
      const next = [...prev]
      next[index] = ((next[index] || 0) + 90) % 360
      return next
    })
  }

  const handleConvert = () => {
    processor.startProcessing({}, {
      validate: (files) => {
        if (files.length === 0) return { valid: false, error: 'Please choose at least one image.' }
        return { valid: true }
      },
      process: async (files, _opts, onProgress, signal) => {
        if (signal?.aborted) throw new DOMException('Operation aborted', 'AbortError')
        const bytes = await imagesToPdf(files, (p, s) => {
          onProgress({ percentage: p, isIndeterminate: false, stage: s })
        }, { rotations })
        const blob = new Blob([bytes as any], { type: 'application/pdf' })
        return {
          blob,
          downloadName: 'converted-images.pdf',
          mimeType: 'application/pdf',
          sizeBytes: blob.size,
        }
      },
    })
  }

  const imagePreviewList = processor.files.length > 0 && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
        Images to Embed ({processor.files.length} image{processor.files.length === 1 ? '' : 's'}):
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '0.75rem',
          maxHeight: '260px',
          overflowY: 'auto',
          padding: '0.5rem',
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {processor.files.map((file, idx) => (
          <div
            key={`${file.name}-${idx}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '0.5rem',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              gap: '0.4rem',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '70px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
              }}
            >
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  transform: `rotate(${rotations[idx] || 0}deg)`,
                  transition: 'transform 0.2s ease',
                }}
              />
            </div>
            <div style={{ fontSize: '0.75rem', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {file.name}
            </div>
            <button
              type="button"
              onClick={() => rotateImageItem(idx)}
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}
              title="Rotate 90°"
            >
              <RotateCw size={12} /> {rotations[idx] || 0}°
            </button>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <ToolWorkspace
      processor={processor}
      acceptedTypes={['.jpg', '.jpeg', '.png', '.webp', 'image/*']}
      supportsMultipleFiles={true}
      minFiles={1}
      maxSizeMb={60}
      dropzoneTitle="Drop JPG, PNG, or WebP images to generate a unified PDF document"
      actionLabel="Create PDF Document"
      onExecute={handleConvert}
      options={imagePreviewList}
      resultTitle="Images Converted to PDF"
    />
  )
}

// ============================================================================
// 6. PDF TO IMAGES VIEW (PDF TO JPG / PDF TO PNG)
// ============================================================================
export const PdfToImagesView: React.FC<{ defaultFormat?: 'jpeg' | 'png' }> = ({ defaultFormat = 'png' }) => {
  const processor = useFileProcessor({
    acceptedTypes: ['.pdf', 'application/pdf'],
    supportsMultipleFiles: false,
    maxSizeMb: 50,
  })

  const [format, setFormat] = useState<'image/jpeg' | 'image/png'>(
    defaultFormat === 'jpeg' ? 'image/jpeg' : 'image/png'
  )
  const [scale, setScale] = useState<number>(1.5)
  const [pageCount, setPageCount] = useState<number | null>(null)

  useEffect(() => {
    let isSubscribed = true
    if (processor.files.length > 0) {
      inspectPdf(processor.files[0])
        .then((info) => {
          if (isSubscribed) setPageCount(info.pageCount)
        })
        .catch(() => {
          if (isSubscribed) setPageCount(null)
        })
    } else {
      setPageCount(null)
    }
    return () => {
      isSubscribed = false
    }
  }, [processor.files])

  const handleConvert = () => {
    processor.startProcessing({}, {
      validate: (files) => {
        if (!files[0]) return { valid: false, error: 'Please choose a PDF document.' }
        return { valid: true }
      },
      process: async (files, _opts, onProgress, signal) => {
        if (signal?.aborted) throw new DOMException('Operation aborted', 'AbortError')
        const file = files[0]
        const rendered = await renderPdfPagesToImages(
          file,
          { format, scale },
          (p, s) => {
            onProgress({ percentage: p, isIndeterminate: false, stage: s })
          }
        )

        const baseName = file.name.replace(/\.[^/.]+$/, '')
        const ext = format === 'image/jpeg' ? 'jpg' : 'png'

        // If single page, download image directly
        if (rendered.length === 1) {
          const blob = rendered[0].blob
          return {
            blob,
            downloadName: `${baseName}_page_01.${ext}`,
            mimeType: format,
            sizeBytes: blob.size,
            previewUrl: URL.createObjectURL(blob),
          }
        }

        // Multiple pages: package into clean ZIP archive
        onProgress({ percentage: 95, isIndeterminate: true, stage: 'Creating ZIP archive of rendered pages...' })
        const zip = new JSZip()
        for (const item of rendered) {
          const pStr = String(item.pageNumber).padStart(2, '0')
          zip.file(`${baseName}_page_${pStr}.${ext}`, item.blob)
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' })
        return {
          blob: zipBlob,
          downloadName: `${baseName}_images.zip`,
          mimeType: 'application/zip',
          sizeBytes: zipBlob.size,
        }
      },
    })
  }

  const exportOptions = processor.files.length > 0 && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {pageCount !== null && (
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Document pages to render: <strong>{pageCount}</strong>
          {pageCount > 1 ? ' (will download as a ZIP bundle of individual images)' : ' (single image download)'}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
            Output Image Format:
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className={`btn ${format === 'image/png' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFormat('image/png')}
            >
              PNG (Lossless)
            </button>
            <button
              type="button"
              className={`btn ${format === 'image/jpeg' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFormat('image/jpeg')}
            >
              JPG (Standard)
            </button>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
            Render Resolution:
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className={`btn ${scale === 1.5 ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setScale(1.5)}
            >
              1.5x (HD Crisp)
            </button>
            <button
              type="button"
              className={`btn ${scale === 2.0 ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setScale(2.0)}
            >
              2.0x (Ultra Sharp)
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <ToolWorkspace
      processor={processor}
      acceptedTypes={['.pdf', 'application/pdf']}
      supportsMultipleFiles={false}
      maxSizeMb={50}
      dropzoneTitle="Drop PDF document to rasterize pages into high-resolution images"
      actionLabel="Convert PDF to Images"
      onExecute={handleConvert}
      options={exportOptions}
      resultTitle="PDF Pages Rendered"
    />
  )
}

// ============================================================================
// 7. EXTRACT TEXT FROM PDF VIEW (PDF TO TEXT)
// ============================================================================
export const PdfExtractTextView: React.FC = () => {
  const processor = useFileProcessor({
    acceptedTypes: ['.pdf', 'application/pdf'],
    supportsMultipleFiles: false,
    maxSizeMb: 50,
  })

  const [extractedStats, setExtractedStats] = useState<{
    wordCount: number
    charCount: number
    pagesWithText: number
    isScannedOrEmpty: boolean
  } | null>(null)

  const handleExtract = () => {
    processor.startProcessing({}, {
      validate: (files) => {
        if (!files[0]) return { valid: false, error: 'Please choose a PDF document.' }
        return { valid: true }
      },
      process: async (files, _opts, onProgress, signal) => {
        if (signal?.aborted) throw new DOMException('Operation aborted', 'AbortError')
        const file = files[0]
        const result = await extractPdfTextContent(file, (p, s) => {
          onProgress({ percentage: p, isIndeterminate: false, stage: s })
        })

        const words = result.text.trim().split(/\s+/).filter(Boolean).length
        setExtractedStats({
          wordCount: words,
          charCount: result.text.length,
          pagesWithText: result.pagesWithText,
          isScannedOrEmpty: result.isScannedOrEmpty,
        })

        const textBlob = new Blob([result.text], { type: 'text/plain;charset=utf-8' })
        const baseName = file.name.replace(/\.[^/.]+$/, '')

        return {
          blob: textBlob,
          downloadName: `${baseName}_extracted.txt`,
          mimeType: 'text/plain',
          sizeBytes: textBlob.size,
          data: result.text,
        }
      },
    })
  }

  return (
    <ToolWorkspace
      processor={processor}
      acceptedTypes={['.pdf', 'application/pdf']}
      supportsMultipleFiles={false}
      maxSizeMb={50}
      dropzoneTitle="Drop PDF document to extract selectable text streams"
      actionLabel="Extract Text from PDF"
      onExecute={handleExtract}
      resultTitle="Text Extracted"
      options={
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.3rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: 'rgba(59, 130, 246, 0.12)',
              color: 'var(--accent-primary)',
              width: 'fit-content',
            }}
          >
            <span>CONVERSION FIDELITY:</span>
            <span>Text Extraction</span>
          </div>

          {extractedStats?.isScannedOrEmpty && (
            <div
              style={{
                padding: '0.85rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--accent-rose, #ef4444)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                display: 'flex',
                gap: '0.6rem',
                alignItems: 'flex-start',
              }}
            >
              <AlertCircle size={18} color="var(--accent-rose, #ef4444)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>No Selectable Text Found:</strong> This document appears to be a scanned image PDF or uses non-standard embedded bitmap fonts. Client-side stream extraction requires digital text glyphs. To extract text from photographed/scanned pages, OCR would be required.
              </div>
            </div>
          )}
        </div>
      }
    />
  )
}

// ============================================================================
// 8. COMPRESS PDF VIEW (HONEST COMPRESSION)
// ============================================================================
export const PdfCompressView: React.FC = () => {
  const processor = useFileProcessor({
    acceptedTypes: ['.pdf', 'application/pdf'],
    supportsMultipleFiles: false,
    maxSizeMb: 100,
  })

  const [stats, setStats] = useState<{
    originalSize: number
    compressedSize: number
    savingsPercent: number
  } | null>(null)

  const handleCompress = () => {
    processor.startProcessing({}, {
      validate: (files) => {
        if (!files[0]) return { valid: false, error: 'Please choose a PDF document.' }
        return { valid: true }
      },
      process: async (files, _opts, onProgress, signal) => {
        if (signal?.aborted) throw new DOMException('Operation aborted', 'AbortError')
        const file = files[0]
        const res = await compressPdfDocument(file, (p, s) => {
          onProgress({ percentage: p, isIndeterminate: false, stage: s })
        })

        setStats({
          originalSize: res.originalSize,
          compressedSize: res.compressedSize,
          savingsPercent: res.savingsPercent,
        })

        const blob = new Blob([res.bytes as any], { type: 'application/pdf' })
        const baseName = file.name.replace(/\.[^/.]+$/, '')

        return {
          blob,
          downloadName: `${baseName}_optimized.pdf`,
          mimeType: 'application/pdf',
          sizeBytes: blob.size,
        }
      },
    })
  }

  const compressionNote = stats && stats.savingsPercent === 0 && (
    <div
      style={{
        padding: '0.85rem',
        background: 'rgba(59, 130, 246, 0.08)',
        border: '1px solid var(--accent-primary)',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.825rem',
        color: 'var(--text-secondary)',
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'flex-start',
      }}
    >
      <Info size={16} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
      <span>
        <strong>Document Already Optimized:</strong> The streams and images in this document are already tightly deflated. Client-side lossless repacking yielded no further byte reduction without destructive image downsampling.
      </span>
    </div>
  )

  return (
    <ToolWorkspace
      processor={processor}
      acceptedTypes={['.pdf', 'application/pdf']}
      supportsMultipleFiles={false}
      maxSizeMb={100}
      dropzoneTitle="Drop PDF document to compress object streams and strip unreferenced metadata"
      actionLabel="Compress PDF Document"
      onExecute={handleCompress}
      originalSizeBytes={stats?.originalSize || processor.files[0]?.size}
      resultTitle="PDF Optimization Complete"
      options={compressionNote || undefined}
    />
  )
}

// ============================================================================
// 9. ADD WATERMARK TO PDF VIEW
// ============================================================================
export const PdfWatermarkView: React.FC = () => {
  const processor = useFileProcessor({
    acceptedTypes: ['.pdf', 'application/pdf'],
    supportsMultipleFiles: false,
    maxSizeMb: 100,
  })

  const [text, setText] = useState('CONFIDENTIAL')
  const [opacity, setOpacity] = useState(0.25)
  const [fontSize, setFontSize] = useState(48)
  const [rotation, setRotation] = useState(45)
  const [colorPreset, setColorPreset] = useState<'gray' | 'red' | 'blue'>('gray')

  const colorMap = {
    gray: { r: 0.5, g: 0.5, b: 0.5 },
    red: { r: 0.85, g: 0.15, b: 0.15 },
    blue: { r: 0.15, g: 0.35, b: 0.85 },
  }

  const handleWatermark = () => {
    processor.startProcessing({}, {
      validate: (files) => {
        if (!files[0]) return { valid: false, error: 'Please choose a PDF document.' }
        if (!text.trim()) return { valid: false, error: 'Please enter watermark text.' }
        return { valid: true }
      },
      process: async (files, _opts, onProgress, signal) => {
        if (signal?.aborted) throw new DOMException('Operation aborted', 'AbortError')
        const file = files[0]
        const bytes = await watermarkPdf(
          file,
          text.trim(),
          {
            opacity,
            size: fontSize,
            rotation,
            color: colorMap[colorPreset],
          },
          (p, s) => {
            onProgress({ percentage: p, isIndeterminate: false, stage: s })
          }
        )

        const blob = new Blob([bytes as any], { type: 'application/pdf' })
        const baseName = file.name.replace(/\.[^/.]+$/, '')

        return {
          blob,
          downloadName: `${baseName}_watermarked.pdf`,
          mimeType: 'application/pdf',
          sizeBytes: blob.size,
        }
      },
    })
  }

  const watermarkOptions = processor.files.length > 0 && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label
          htmlFor="watermark-text"
          style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}
        >
          Watermark Text:
        </label>
        <input
          id="watermark-text"
          type="text"
          className="search-input"
          style={{ width: '100%', padding: '0.65rem 0.85rem' }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. CONFIDENTIAL, DRAFT, SAMPLE"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
            Opacity: {Math.round(opacity * 100)}%
          </label>
          <input
            type="range"
            min="0.1"
            max="0.9"
            step="0.05"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
            Font Size: {fontSize}px
          </label>
          <input
            type="range"
            min="24"
            max="96"
            step="4"
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
            Angle: {rotation}°
          </label>
          <input
            type="range"
            min="-90"
            max="90"
            step="15"
            value={rotation}
            onChange={(e) => setRotation(parseInt(e.target.value, 10))}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>
            Color:
          </label>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {(['gray', 'red', 'blue'] as const).map((col) => (
              <button
                key={col}
                type="button"
                className={`btn btn-sm ${colorPreset === col ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setColorPreset(col)}
                style={{ textTransform: 'capitalize' }}
              >
                {col}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <ToolWorkspace
      processor={processor}
      acceptedTypes={['.pdf', 'application/pdf']}
      supportsMultipleFiles={false}
      maxSizeMb={100}
      dropzoneTitle="Drop PDF document to stamp custom text watermark"
      actionLabel="Apply Watermark"
      onExecute={handleWatermark}
      options={watermarkOptions}
      resultTitle="Watermark Stamped Successfully"
    />
  )
}

// ============================================================================
// 10. UNLOCK PDF VIEW
// ============================================================================
export const PdfUnlockView: React.FC = () => {
  const processor = useFileProcessor({
    acceptedTypes: ['.pdf', 'application/pdf'],
    supportsMultipleFiles: false,
    maxSizeMb: 100,
  })

  const [password, setPassword] = useState('')

  const handleUnlock = () => {
    processor.startProcessing({}, {
      validate: (files) => {
        if (!files[0]) return { valid: false, error: 'Please choose a PDF document.' }
        return { valid: true }
      },
      process: async (files, _opts, onProgress, signal) => {
        if (signal?.aborted) throw new DOMException('Operation aborted', 'AbortError')
        const file = files[0]
        const res = await unlockPdf(file, password.trim() || undefined, (p, s) => {
          onProgress({ percentage: p, isIndeterminate: false, stage: s })
        })

        const blob = new Blob([res.bytes as any], { type: 'application/pdf' })
        const baseName = file.name.replace(/\.[^/.]+$/, '')

        return {
          blob,
          downloadName: `${baseName}_unlocked.pdf`,
          mimeType: 'application/pdf',
          sizeBytes: blob.size,
        }
      },
    })
  }

  const unlockOptions = processor.files.length > 0 && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div
        style={{
          padding: '0.75rem',
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
        }}
      >
        <strong>What this does:</strong> Strips owner permission restriction tables (printing, copying, content extraction lockouts) directly in your browser without requiring a server. If the document has an open/read password, enter it below to re-serialize an unrestricted copy.
      </div>

      <div>
        <label
          htmlFor="unlock-password"
          style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}
        >
          Password (optional, if required to open document):
        </label>
        <input
          id="unlock-password"
          type="password"
          className="search-input"
          style={{ width: '100%', padding: '0.65rem 0.85rem' }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Leave blank for owner-restricted documents"
        />
      </div>
    </div>
  )

  return (
    <ToolWorkspace
      processor={processor}
      acceptedTypes={['.pdf', 'application/pdf']}
      supportsMultipleFiles={false}
      maxSizeMb={100}
      dropzoneTitle="Drop locked or permission-restricted PDF document to unlock"
      actionLabel="Unlock PDF Document"
      onExecute={handleUnlock}
      options={unlockOptions}
      resultTitle="Document Unlocked"
    />
  )
}

// ============================================================================
// 11. PROTECT PDF FEASIBILITY & ADVISORY VIEW
// ============================================================================
export const PdfProtectView: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        maxWidth: '720px',
        margin: '0 auto',
        padding: '2rem',
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <ShieldAlert size={28} color="var(--accent-amber, #f59e0b)" />
        <div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
            Protect PDF: Technical Feasibility Disclosure
          </h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Client-Side Architecture & Security Reality
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
        <p>
          MicroTools is strictly committed to <strong>100% genuine client-side processing</strong> and <strong>zero fake outputs</strong>.
        </p>

        <div
          style={{
            padding: '1rem',
            background: 'var(--bg-primary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
            Why client-side PDF encryption is restricted:
          </h4>
          <ul style={{ paddingLeft: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>
              <strong>Standard Specification (ISO 32000):</strong> Proper PDF password protection requires generating an encrypted Trailer dictionary with RC4-128 or AES-256 cipher blocks and key derivation tables (hash algorithm SHA-256 + 32-byte permission masks).
            </li>
            <li>
              <strong>Browser Engine Limitations:</strong> Lightweight browser libraries like <code>pdf-lib</code> support <em>reading</em> and modifying unencrypted documents, but intentionally omit the full 15MB+ native crypto engine required to write spec-compliant encrypted PDF cross-reference tables.
            </li>
            <li>
              <strong>Integrity Guarantee:</strong> Many websites "fake" PDF encryption by appending arbitrary XOR bytes or altering headers, which results in corrupted files that fail in Adobe Acrobat. MicroTools will never generate fake or corrupted documents.
            </li>
          </ul>
        </div>

        <p>
          <strong>Alternative Client-Side Security:</strong> If you need to secure your documents privately in-browser without sending them to an external cloud server, we recommend bundling the document into an <strong>encrypted ZIP archive</strong> using our ZIP Creator tool, which natively supports browser-based client-side encryption.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <a href="#/tool/zip-creator" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          Use Encrypted ZIP Creator <ExternalLink size={14} />
        </a>
      </div>
    </div>
  )
}

// ============================================================================
// 12. PDF TO WORD VIEW (CLIENT-SIDE TEXT EXTRACTION TO DOCX)
// ============================================================================
export const PdfToWordView: React.FC = () => {
  const processor = useFileProcessor({
    acceptedTypes: ['.pdf', 'application/pdf'],
    supportsMultipleFiles: false,
    maxSizeMb: 50,
  })

  const handleConvert = () => {
    processor.startProcessing({}, {
      validate: (files) => {
        if (!files[0]) return { valid: false, error: 'Please choose a PDF document.' }
        return { valid: true }
      },
      process: async (files, _opts, onProgress, signal) => {
        if (signal?.aborted) throw new DOMException('Operation aborted', 'AbortError')
        const file = files[0]
        const docxBlob = await pdfToDocx(file, (p, s) => {
          onProgress({ percentage: p, isIndeterminate: false, stage: s })
        })

        const baseName = file.name.replace(/\.[^/.]+$/, '')
        return {
          blob: docxBlob,
          downloadName: `${baseName}.docx`,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          sizeBytes: docxBlob.size,
        }
      },
    })
  }

  const wordNotice = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.3rem 0.65rem',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.75rem',
          fontWeight: 700,
          background: 'rgba(59, 130, 246, 0.12)',
          color: 'var(--accent-primary)',
          width: 'fit-content',
        }}
      >
        <span>CONVERSION FIDELITY:</span>
        <span>Text Extraction to Document</span>
      </div>

      <div
        style={{
          padding: '0.85rem',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.825rem',
          lineHeight: 1.5,
          color: 'var(--text-secondary)',
        }}
      >
        <p style={{ margin: '0 0 0.5rem 0' }}>
          <strong>Genuine Client-Side Word Generation:</strong> Extracts digital text streams and generates a valid ECMA-376 Microsoft Word (<code>.docx</code>) document locally in your browser.
        </p>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          <em>Layout Disclosure:</em> Text content and paragraphs are fully preserved and reflowable. Exact 2D graphical positions, complex multi-column floating boxes, and scanned images without digital fonts are approximate.
        </p>
      </div>
    </div>
  )

  return (
    <ToolWorkspace
      processor={processor}
      acceptedTypes={['.pdf', 'application/pdf']}
      supportsMultipleFiles={false}
      maxSizeMb={50}
      dropzoneTitle="Drop PDF document to convert text into Microsoft Word (.docx)"
      actionLabel="Convert PDF to Word (.docx)"
      onExecute={handleConvert}
      options={wordNotice}
      resultTitle="Word Document Generated"
    />
  )
}

// ============================================================================
// 13. PDF TO EXCEL VIEW (CLIENT-SIDE TABULAR EXTRACTION TO XLSX)
// ============================================================================
export const PdfToExcelView: React.FC = () => {
  const processor = useFileProcessor({
    acceptedTypes: ['.pdf', 'application/pdf'],
    supportsMultipleFiles: false,
    maxSizeMb: 50,
  })

  const [extractedRows, setExtractedRows] = useState<number | null>(null)

  const handleConvert = () => {
    processor.startProcessing({}, {
      validate: (files) => {
        if (!files[0]) return { valid: false, error: 'Please choose a PDF document.' }
        return { valid: true }
      },
      process: async (files, _opts, onProgress, signal) => {
        if (signal?.aborted) throw new DOMException('Operation aborted', 'AbortError')
        const file = files[0]
        const rows = await extractPdfTabularData(file, (p, s) => {
          onProgress({ percentage: p, isIndeterminate: false, stage: s })
        })

        if (!rows || rows.length === 0) {
          throw new Error('No tabular text detected in this PDF. Note: scanned/image PDFs require OCR.')
        }

        setExtractedRows(rows.length)
        onProgress({ percentage: 90, isIndeterminate: true, stage: 'Generating Excel (.xlsx) workbook...' })
        const xlsxBlob = tabularDataToExcelBlob(rows, 'Extracted Data')

        const baseName = file.name.replace(/\.[^/.]+$/, '')
        return {
          blob: xlsxBlob,
          downloadName: `${baseName}.xlsx`,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          sizeBytes: xlsxBlob.size,
        }
      },
    })
  }

  const excelNotice = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.3rem 0.65rem',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.75rem',
          fontWeight: 700,
          background: 'rgba(16, 185, 129, 0.12)',
          color: 'var(--accent-emerald, #10b981)',
          width: 'fit-content',
        }}
      >
        <span>CONVERSION FIDELITY:</span>
        <span>Approximate / Tabular Text Extraction</span>
      </div>

      <div
        style={{
          padding: '0.85rem',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.825rem',
          lineHeight: 1.5,
          color: 'var(--text-secondary)',
        }}
      >
        <p style={{ margin: '0 0 0.5rem 0' }}>
          <strong>Client-Side Tabular Clustering:</strong> Groups 2D coordinate text elements into table rows and numerical columns, then generates a genuine <code>.xlsx</code> spreadsheet workbook.
        </p>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          <em>Layout Disclosure:</em> Optimal for financial statements, invoices, and columnar data. Non-tabular narrative paragraphs or scanned/photographed PDFs will not produce clean grid columns.
        </p>
      </div>

      {extractedRows !== null && (
        <div style={{ fontSize: '0.85rem', color: 'var(--accent-emerald, #10b981)', fontWeight: 600 }}>
          Successfully reconstructed {extractedRows} table rows into Excel sheet!
        </div>
      )}
    </div>
  )

  return (
    <ToolWorkspace
      processor={processor}
      acceptedTypes={['.pdf', 'application/pdf']}
      supportsMultipleFiles={false}
      maxSizeMb={50}
      dropzoneTitle="Drop PDF document to extract tabular data into Excel (.xlsx)"
      actionLabel="Convert PDF to Excel (.xlsx)"
      onExecute={handleConvert}
      options={excelNotice}
      resultTitle="Excel Spreadsheet Generated"
    />
  )
}

// ============================================================================
// 14. OFFICE CONVERSION FEASIBILITY VIEW (BACKWARD COMPATIBILITY)
// ============================================================================
export const PdfOfficeFeasibilityView: React.FC<{ targetFormat: 'word' | 'excel' }> = ({ targetFormat }) => {
  if (targetFormat === 'word') {
    return <PdfToWordView />
  }
  return <PdfToExcelView />
}
