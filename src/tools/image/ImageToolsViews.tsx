import React, { useState, useEffect, useRef } from 'react'
import {
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Type,
  ImageIcon,
  ShieldCheck,
  Copy,
  Check,
} from 'lucide-react'
import {
  compressImageAdvanced,
  resizeImageDimensions,
  cropImageCanvas,
  convertFormatDirect,
  rotateAndFlipImage,
  applyWatermarkAdvanced,
  enhanceImage,
  removeColorBackground,
  extractColorPalette,
  stripExifMetadata,
  getImageDimensions,
  loadImage,
} from '../../core/engine/image/imageEngine'
import { useFileProcessor } from '../../hooks/useFileProcessor'
import { ToolWorkspace } from '../../components/framework/ToolWorkspace'
import { formatBytes } from '../../services/file/fileUtils'

// ============================================================================
// 1. IMAGE COMPRESSOR VIEW
// ============================================================================
export const ImageCompressView: React.FC = () => {
  const [quality, setQuality] = useState(0.8)
  const [format, setFormat] = useState<'image/jpeg' | 'image/webp' | 'image/png'>('image/jpeg')
  const [maxWidth, setMaxWidth] = useState<string>('')
  const [maxHeight, setMaxHeight] = useState<string>('')
  const [origDims, setOrigDims] = useState<{ width: number; height: number } | null>(null)

  const processor = useFileProcessor({
    acceptedTypes: ['image/*', '.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif'],
    supportsMultipleFiles: false,
    maxSizeMb: 50,
  })

  useEffect(() => {
    let active = true
    if (processor.files.length > 0) {
      getImageDimensions(processor.files[0])
        .then((dims) => {
          if (active) setOrigDims(dims)
        })
        .catch(() => {
          if (active) setOrigDims(null)
        })
    } else {
      setOrigDims(null)
      setMaxWidth('')
      setMaxHeight('')
    }
    return () => {
      active = false
    }
  }, [processor.files])

  const handleCompress = () => {
    processor.startProcessing({}, {
      validate: (files) => {
        if (!files[0]) return { valid: false, error: 'Please choose an image to compress.' }
        return { valid: true }
      },
      process: async (files, _opts, onProgress, signal) => {
        if (signal?.aborted) throw new DOMException('Operation cancelled', 'AbortError')

        onProgress({
          isIndeterminate: true,
          stage: `Compressing image to ${format.replace('image/', '').toUpperCase()} at ${Math.round(quality * 100)}% quality...`,
        })

        const file = files[0]
        const maxW = maxWidth ? parseInt(maxWidth, 10) : undefined
        const maxH = maxHeight ? parseInt(maxHeight, 10) : undefined

        const res = await compressImageAdvanced(file, {
          quality,
          format,
          maxWidth: maxW && !isNaN(maxW) ? maxW : undefined,
          maxHeight: maxH && !isNaN(maxH) ? maxH : undefined,
        })

        const baseName = file.name.replace(/\.[^/.]+$/, '')
        const ext = format === 'image/webp' ? 'webp' : format === 'image/png' ? 'png' : 'jpg'

        return {
          blob: res.blob,
          downloadName: `compressed_${baseName}.${ext}`,
          mimeType: format,
          sizeBytes: res.compressedSize,
          previewUrl: URL.createObjectURL(res.blob),
        }
      },
    })
  }

  const compressOptions = processor.files.length > 0 && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {origDims && (
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Original dimensions: <strong>{origDims.width} &times; {origDims.height} px</strong> ({formatBytes(processor.files[0].size)})
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            Output Encoding:
          </label>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {(['image/jpeg', 'image/webp', 'image/png'] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                className={`btn btn-sm ${format === fmt ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFormat(fmt)}
              >
                {fmt === 'image/jpeg' ? 'JPEG' : fmt === 'image/webp' ? 'WebP' : 'PNG'}
              </button>
            ))}
          </div>
        </div>

        {format !== 'image/png' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Quality: {Math.round(quality * 100)}%</label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {quality > 0.8 ? 'High fidelity' : quality > 0.5 ? 'Balanced' : 'Max savings'}
              </span>
            </div>
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
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            Max Width (optional):
          </label>
          <input
            type="number"
            className="search-input"
            placeholder={origDims ? `e.g. ${origDims.width}` : 'Auto'}
            value={maxWidth}
            onChange={(e) => setMaxWidth(e.target.value)}
            style={{ width: '100%', padding: '0.5rem 0.75rem' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
            Max Height (optional):
          </label>
          <input
            type="number"
            className="search-input"
            placeholder={origDims ? `e.g. ${origDims.height}` : 'Auto'}
            value={maxHeight}
            onChange={(e) => setMaxHeight(e.target.value)}
            style={{ width: '100%', padding: '0.5rem 0.75rem' }}
          />
        </div>
      </div>
    </div>
  )

  return (
    <ToolWorkspace
      processor={processor}
      acceptedTypes={['image/*', '.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif']}
      supportsMultipleFiles={false}
      maxSizeMb={50}
      dropzoneTitle="Drop an image to compress (JPG, PNG, WebP, BMP)"
      actionLabel="Compress Image"
      onExecute={handleCompress}
      options={compressOptions}
      originalSizeBytes={processor.files[0]?.size}
      resultTitle="Image Compressed"
    />
  )
}

// ============================================================================
// 2. IMAGE RESIZER VIEW
// ============================================================================
export const ImageResizeView: React.FC = () => {
  const [width, setWidth] = useState<number>(0)
  const [height, setHeight] = useState<number>(0)
  const [aspectRatio, setAspectRatio] = useState<number>(1)
  const [maintainAspect, setMaintainAspect] = useState<boolean>(true)
  const [format, setFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/png')

  const processor = useFileProcessor({
    acceptedTypes: ['image/*', '.jpg', '.jpeg', '.png', '.webp', '.bmp'],
    supportsMultipleFiles: false,
    maxSizeMb: 50,
  })

  useEffect(() => {
    let active = true
    if (processor.files.length > 0) {
      getImageDimensions(processor.files[0])
        .then((dims) => {
          if (!active) return
          setWidth(dims.width)
          setHeight(dims.height)
          setAspectRatio(dims.width / dims.height)
        })
        .catch(() => {})
    } else {
      setWidth(0)
      setHeight(0)
    }
    return () => {
      active = false
    }
  }, [processor.files])

  const handleWidthChange = (val: number) => {
    setWidth(val)
    if (maintainAspect && aspectRatio > 0) {
      setHeight(Math.max(1, Math.round(val / aspectRatio)))
    }
  }

  const handleHeightChange = (val: number) => {
    setHeight(val)
    if (maintainAspect && aspectRatio > 0) {
      setWidth(Math.max(1, Math.round(val * aspectRatio)))
    }
  }

  const applyPreset = (presetW: number, presetH: number) => {
    setWidth(presetW)
    setHeight(presetH)
    setMaintainAspect(false)
  }

  const handleResize = () => {
    processor.startProcessing({}, {
      validate: (files) => {
        if (!files[0]) return { valid: false, error: 'Please choose an image.' }
        if (width <= 0 || height <= 0) return { valid: false, error: 'Target dimensions must be positive numbers.' }
        return { valid: true }
      },
      process: async (files, _opts, onProgress, signal) => {
        if (signal?.aborted) throw new DOMException('Operation cancelled', 'AbortError')

        onProgress({ isIndeterminate: true, stage: `Resizing to ${width}x${height}...` })
        const blob = await resizeImageDimensions(files[0], {
          targetWidth: width,
          targetHeight: height,
          format,
        })

        const baseName = files[0].name.replace(/\.[^/.]+$/, '')
        const ext = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg'

        return {
          blob,
          downloadName: `${baseName}_${width}x${height}.${ext}`,
          mimeType: format,
          sizeBytes: blob.size,
          previewUrl: URL.createObjectURL(blob),
        }
      },
    })
  }

  const resizeOptions = processor.files.length > 0 && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Dimension Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            Width (pixels):
          </label>
          <input
            type="number"
            className="search-input"
            value={width || ''}
            onChange={(e) => handleWidthChange(parseInt(e.target.value, 10) || 0)}
            style={{ width: '100%', padding: '0.6rem 0.85rem' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            Height (pixels):
          </label>
          <input
            type="number"
            className="search-input"
            value={height || ''}
            onChange={(e) => handleHeightChange(parseInt(e.target.value, 10) || 0)}
            style={{ width: '100%', padding: '0.6rem 0.85rem' }}
          />
        </div>
      </div>

      {/* Maintain Aspect Ratio Toggle */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={maintainAspect}
          onChange={(e) => {
            setMaintainAspect(e.target.checked)
            if (e.target.checked && height > 0) setAspectRatio(width / height)
          }}
        />
        <strong>Maintain aspect ratio</strong> ({aspectRatio.toFixed(2)}:1)
      </label>

      {/* Presets */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
          Quick Social & Display Presets:
        </label>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Instagram Square (1080x1080)', w: 1080, h: 1080 },
            { label: 'Story / Reel (1080x1920)', w: 1080, h: 1920 },
            { label: 'Full HD (1920x1080)', w: 1920, h: 1080 },
            { label: 'HD 720p (1280x720)', w: 1280, h: 720 },
            { label: 'Banner (1500x500)', w: 1500, h: 500 },
          ].map((p) => (
            <button
              key={p.label}
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => applyPreset(p.w, p.h)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Format Selector */}
      <div>
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
          Output Format:
        </label>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {(['image/png', 'image/jpeg', 'image/webp'] as const).map((fmt) => (
            <button
              key={fmt}
              type="button"
              className={`btn btn-sm ${format === fmt ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFormat(fmt)}
            >
              {fmt === 'image/png' ? 'PNG' : fmt === 'image/jpeg' ? 'JPEG' : 'WebP'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <ToolWorkspace
      processor={processor}
      acceptedTypes={['image/*', '.jpg', '.jpeg', '.png', '.webp', '.bmp']}
      supportsMultipleFiles={false}
      maxSizeMb={50}
      dropzoneTitle="Drop image to resize dimensions with aspect ratio lock"
      actionLabel={`Resize to ${width}x${height}px`}
      onExecute={handleResize}
      options={resizeOptions}
      resultTitle="Image Resized"
    />
  )
}

// ============================================================================
// 3. IMAGE CROPPER VIEW
// ============================================================================
export const ImageCropView: React.FC = () => {
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0,
    y: 0,
    width: 300,
    height: 300,
  })
  const [imgDims, setImgDims] = useState<{ width: number; height: number } | null>(null)
  const [aspectPreset, setAspectPreset] = useState<'free' | '1:1' | '4:3' | '16:9' | '9:16' | '3:2'>('free')
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const processor = useFileProcessor({
    acceptedTypes: ['image/*', '.jpg', '.jpeg', '.png', '.webp'],
    supportsMultipleFiles: false,
    maxSizeMb: 50,
  })

  useEffect(() => {
    let active = true
    if (processor.files.length > 0) {
      getImageDimensions(processor.files[0])
        .then((dims) => {
          if (!active) return
          setImgDims(dims)
          const size = Math.min(dims.width, dims.height)
          setCropBox({
            x: Math.round((dims.width - size) / 2),
            y: Math.round((dims.height - size) / 2),
            width: size,
            height: size,
          })
        })
        .catch(() => {})
    } else {
      setImgDims(null)
    }
    return () => {
      active = false
    }
  }, [processor.files])

  // Live Canvas Thumbnail Preview of Crop Region
  useEffect(() => {
    if (!processor.files[0] || !previewCanvasRef.current || !imgDims) return
    let active = true
    loadImage(processor.files[0]).then((img) => {
      if (!active || !previewCanvasRef.current) return
      const canvas = previewCanvasRef.current
      canvas.width = Math.min(320, cropBox.width)
      canvas.height = Math.round((canvas.width * cropBox.height) / cropBox.width)
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, cropBox.x, cropBox.y, cropBox.width, cropBox.height, 0, 0, canvas.width, canvas.height)
      }
    })
    return () => {
      active = false
    }
  }, [processor.files, cropBox, imgDims])

  const setPresetRatio = (preset: 'free' | '1:1' | '4:3' | '16:9' | '9:16' | '3:2') => {
    setAspectPreset(preset)
    if (!imgDims || preset === 'free') return

    let targetRatio = 1
    if (preset === '1:1') targetRatio = 1
    else if (preset === '4:3') targetRatio = 4 / 3
    else if (preset === '16:9') targetRatio = 16 / 9
    else if (preset === '9:16') targetRatio = 9 / 16
    else if (preset === '3:2') targetRatio = 3 / 2

    let w = cropBox.width
    let h = Math.round(w / targetRatio)

    if (h > imgDims.height) {
      h = imgDims.height
      w = Math.round(h * targetRatio)
    }
    if (w > imgDims.width) {
      w = imgDims.width
      h = Math.round(w / targetRatio)
    }

    setCropBox((prev) => ({
      x: Math.min(prev.x, imgDims.width - w),
      y: Math.min(prev.y, imgDims.height - h),
      width: w,
      height: h,
    }))
  }

  const handleCrop = () => {
    processor.startProcessing({}, {
      validate: (files) => {
        if (!files[0]) return { valid: false, error: 'Please choose an image.' }
        if (cropBox.width <= 0 || cropBox.height <= 0) return { valid: false, error: 'Invalid crop area.' }
        return { valid: true }
      },
      process: async (files, _opts, onProgress, signal) => {
        if (signal?.aborted) throw new DOMException('Operation cancelled', 'AbortError')

        onProgress({ isIndeterminate: true, stage: 'Cropping image area...' })
        const blob = await cropImageCanvas(files[0], {
          x: cropBox.x,
          y: cropBox.y,
          width: cropBox.width,
          height: cropBox.height,
        })

        const baseName = files[0].name.replace(/\.[^/.]+$/, '')
        return {
          blob,
          downloadName: `${baseName}_cropped.png`,
          mimeType: 'image/png',
          sizeBytes: blob.size,
          previewUrl: URL.createObjectURL(blob),
        }
      },
    })
  }

  const cropOptions = processor.files.length > 0 && imgDims && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Preset Buttons */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
          Aspect Ratio Presets:
        </label>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {(['free', '1:1', '4:3', '16:9', '9:16', '3:2'] as const).map((p) => (
            <button
              key={p}
              type="button"
              className={`btn btn-sm ${aspectPreset === p ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPresetRatio(p)}
              style={{ textTransform: 'uppercase' }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Coordinate Sliders */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.2rem' }}>
            Crop Width: {cropBox.width}px
          </label>
          <input
            type="range"
            min="30"
            max={imgDims.width}
            value={cropBox.width}
            onChange={(e) => {
              const w = parseInt(e.target.value, 10)
              setCropBox((prev) => ({
                ...prev,
                width: w,
                x: Math.min(prev.x, imgDims.width - w),
                height: aspectPreset !== 'free' ? Math.round(w / (cropBox.width / cropBox.height)) : prev.height,
              }))
            }}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.2rem' }}>
            Crop Height: {cropBox.height}px
          </label>
          <input
            type="range"
            min="30"
            max={imgDims.height}
            value={cropBox.height}
            onChange={(e) => {
              const h = parseInt(e.target.value, 10)
              setCropBox((prev) => ({
                ...prev,
                height: h,
                y: Math.min(prev.y, imgDims.height - h),
              }))
            }}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.2rem' }}>
            Horizontal Offset (X): {cropBox.x}px
          </label>
          <input
            type="range"
            min="0"
            max={Math.max(0, imgDims.width - cropBox.width)}
            value={cropBox.x}
            onChange={(e) => setCropBox((prev) => ({ ...prev, x: parseInt(e.target.value, 10) }))}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.2rem' }}>
            Vertical Offset (Y): {cropBox.y}px
          </label>
          <input
            type="range"
            min="0"
            max={Math.max(0, imgDims.height - cropBox.height)}
            value={cropBox.y}
            onChange={(e) => setCropBox((prev) => ({ ...prev, y: parseInt(e.target.value, 10) }))}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      {/* Live Preview Box */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Crop Preview ({cropBox.width} &times; {cropBox.height} px):</span>
        <canvas ref={previewCanvasRef} style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }} />
      </div>
    </div>
  )

  return (
    <ToolWorkspace
      processor={processor}
      acceptedTypes={['image/*', '.jpg', '.jpeg', '.png', '.webp']}
      supportsMultipleFiles={false}
      maxSizeMb={50}
      dropzoneTitle="Drop an image to crop with aspect ratio presets"
      actionLabel={`Crop Image (${cropBox.width}x${cropBox.height})`}
      onExecute={handleCrop}
      options={cropOptions}
      resultTitle="Image Cropped"
    />
  )
}

// ============================================================================
// 4. IMAGE CONVERTER VIEW (UNIVERSAL & DEDICATED)
// ============================================================================
export const ImageConvertView: React.FC<{ defaultTarget?: 'png' | 'jpg' | 'webp' | 'bmp' }> = ({
  defaultTarget = 'png',
}) => {
  const [targetFormat, setTargetFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp' | 'image/bmp'>(
    defaultTarget === 'jpg'
      ? 'image/jpeg'
      : defaultTarget === 'webp'
      ? 'image/webp'
      : defaultTarget === 'bmp'
      ? 'image/bmp'
      : 'image/png'
  )
  const [quality, setQuality] = useState<number>(0.92)
  const [bgColor, setBgColor] = useState<string>('#ffffff')

  const processor = useFileProcessor({
    acceptedTypes: ['image/*', '.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif'],
    supportsMultipleFiles: false,
    maxSizeMb: 50,
  })

  const handleConvert = () => {
    processor.startProcessing({}, {
      validate: (files) => {
        if (!files[0]) return { valid: false, error: 'Please select an image to convert.' }
        return { valid: true }
      },
      process: async (files, _opts, onProgress, signal) => {
        if (signal?.aborted) throw new DOMException('Operation cancelled', 'AbortError')

        const fmtLabel = targetFormat.replace('image/', '').toUpperCase()
        onProgress({ isIndeterminate: true, stage: `Converting image to ${fmtLabel}...` })

        const blob = await convertFormatDirect(files[0], {
          targetFormat,
          quality,
          backgroundColor: bgColor,
        })

        const baseName = files[0].name.replace(/\.[^/.]+$/, '')
        const ext = targetFormat === 'image/jpeg' ? 'jpg' : targetFormat.replace('image/', '')

        return {
          blob,
          downloadName: `${baseName}.${ext}`,
          mimeType: targetFormat,
          sizeBytes: blob.size,
          previewUrl: targetFormat !== 'image/bmp' ? URL.createObjectURL(blob) : undefined,
        }
      },
    })
  }

  const convertOptions = processor.files.length > 0 && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
          Target Format:
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { fmt: 'image/png', label: 'PNG (Lossless & Alpha)' },
            { fmt: 'image/jpeg', label: 'JPEG (Universal Photo)' },
            { fmt: 'image/webp', label: 'WebP (Modern Compressed)' },
            { fmt: 'image/bmp', label: 'BMP (Windows Bitmap)' },
          ].map((item) => (
            <button
              key={item.fmt}
              type="button"
              className={`btn btn-sm ${targetFormat === item.fmt ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTargetFormat(item.fmt as any)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {(targetFormat === 'image/jpeg' || targetFormat === 'image/bmp') && (
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
            Fill Color for Transparent Areas:
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              style={{ width: '36px', height: '36px', borderRadius: '4px', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              JPEG and BMP do not support transparency. White (#ffffff) is recommended.
            </span>
          </div>
        </div>
      )}

      {(targetFormat === 'image/jpeg' || targetFormat === 'image/webp') && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Quality: {Math.round(quality * 100)}%</label>
          </div>
          <input
            type="range"
            min="0.2"
            max="1.0"
            step="0.05"
            value={quality}
            onChange={(e) => setQuality(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
      )}
    </div>
  )

  const extName = targetFormat.replace('image/', '').toUpperCase()

  return (
    <ToolWorkspace
      processor={processor}
      acceptedTypes={['image/*', '.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif']}
      supportsMultipleFiles={false}
      maxSizeMb={50}
      dropzoneTitle="Drop image to convert between JPG, PNG, WebP, and BMP"
      actionLabel={`Convert to ${extName}`}
      onExecute={handleConvert}
      options={convertOptions}
      resultTitle="Image Converted Successfully"
    />
  )
}

// ============================================================================
// 5. IMAGE ROTATOR & FLIPPER VIEW
// ============================================================================
export const ImageRotateFlipView: React.FC = () => {
  const [degrees, setDegrees] = useState<number>(0)
  const [flipH, setFlipH] = useState<boolean>(false)
  const [flipV, setFlipV] = useState<boolean>(false)

  const processor = useFileProcessor({
    acceptedTypes: ['image/*', '.jpg', '.jpeg', '.png', '.webp'],
    supportsMultipleFiles: false,
    maxSizeMb: 50,
  })

  const handleTransform = () => {
    processor.startProcessing({}, {
      validate: (files) => {
        if (!files[0]) return { valid: false, error: 'Please select an image.' }
        return { valid: true }
      },
      process: async (files, _opts, onProgress, signal) => {
        if (signal?.aborted) throw new DOMException('Operation cancelled', 'AbortError')

        onProgress({ isIndeterminate: true, stage: `Rotating ${degrees}° and flipping...` })
        const blob = await rotateAndFlipImage(files[0], {
          degrees,
          flipH,
          flipV,
        })

        const baseName = files[0].name.replace(/\.[^/.]+$/, '')
        return {
          blob,
          downloadName: `${baseName}_transformed.png`,
          mimeType: 'image/png',
          sizeBytes: blob.size,
          previewUrl: URL.createObjectURL(blob),
        }
      },
    })
  }

  const transformOptions = processor.files.length > 0 && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
          Rotation Angle:
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          {[90, 180, 270].map((deg) => (
            <button
              key={deg}
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setDegrees((prev) => (prev + deg) % 360)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <RotateCw size={14} /> +{deg}°
            </button>
          ))}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setDegrees(0)}
          >
            Reset Angle
          </button>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.8rem' }}>
            <span>Fine-tune Arbitrary Angle:</span>
            <strong>{degrees}°</strong>
          </div>
          <input
            type="range"
            min="-180"
            max="180"
            step="1"
            value={degrees}
            onChange={(e) => setDegrees(parseInt(e.target.value, 10))}
            style={{ width: '100%' }}
          />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
          Flip & Mirror:
        </label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className={`btn btn-sm ${flipH ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFlipH(!flipH)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <FlipHorizontal size={14} /> Flip Horizontal (Mirror)
          </button>
          <button
            type="button"
            className={`btn btn-sm ${flipV ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFlipV(!flipV)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <FlipVertical size={14} /> Flip Vertical
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <ToolWorkspace
      processor={processor}
      acceptedTypes={['image/*', '.jpg', '.jpeg', '.png', '.webp']}
      supportsMultipleFiles={false}
      maxSizeMb={50}
      dropzoneTitle="Drop image to rotate and flip orientation"
      actionLabel={`Apply Transformation (${degrees}°)`}
      onExecute={handleTransform}
      options={transformOptions}
      resultTitle="Image Transformed"
    />
  )
}

// ============================================================================
// 6. IMAGE WATERMARK VIEW (TEXT & LOGO STAMP)
// ============================================================================
export const ImageWatermarkView: React.FC = () => {
  const [tab, setTab] = useState<'text' | 'image'>('text')

  // Text options
  const [text, setText] = useState('COPYRIGHT')
  const [position, setPosition] = useState<'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'tile'>('center')
  const [fontSize, setFontSize] = useState<number>(36)
  const [textColor, setTextColor] = useState<string>('#ffffff')
  const [textOpacity, setTextOpacity] = useState<number>(0.4)

  // Image logo options
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoScale, setLogoScale] = useState<number>(0.2)
  const [logoOpacity, setLogoOpacity] = useState<number>(0.6)

  const processor = useFileProcessor({
    acceptedTypes: ['image/*', '.jpg', '.jpeg', '.png', '.webp'],
    supportsMultipleFiles: false,
    maxSizeMb: 50,
  })

  const handleWatermark = () => {
    processor.startProcessing({}, {
      validate: (files) => {
        if (!files[0]) return { valid: false, error: 'Please choose a base image.' }
        if (tab === 'text' && !text.trim()) return { valid: false, error: 'Please enter watermark text.' }
        if (tab === 'image' && !logoFile) return { valid: false, error: 'Please upload a watermark logo image.' }
        return { valid: true }
      },
      process: async (files, _opts, onProgress, signal) => {
        if (signal?.aborted) throw new DOMException('Operation cancelled', 'AbortError')

        onProgress({ isIndeterminate: true, stage: 'Stamping watermark overlay...' })
        const blob = await applyWatermarkAdvanced(files[0], {
          textConfig: tab === 'text' ? {
            text,
            position,
            fontSize,
            textColor,
            opacity: textOpacity,
            stroke: true,
          } : undefined,
          imageConfig: tab === 'image' && logoFile ? {
            logoFile,
            position: position === 'tile' ? 'bottom-right' : position,
            scale: logoScale,
            opacity: logoOpacity,
          } : undefined,
        })

        const baseName = files[0].name.replace(/\.[^/.]+$/, '')
        return {
          blob,
          downloadName: `${baseName}_watermarked.png`,
          mimeType: 'image/png',
          sizeBytes: blob.size,
          previewUrl: URL.createObjectURL(blob),
        }
      },
    })
  }

  const watermarkOptions = processor.files.length > 0 && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Mode Selector */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
        <button
          type="button"
          className={`btn btn-sm ${tab === 'text' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('text')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <Type size={14} /> Text Watermark
        </button>
        <button
          type="button"
          className={`btn btn-sm ${tab === 'image' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('image')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <ImageIcon size={14} /> Logo / Image Overlay
        </button>
      </div>

      {tab === 'text' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Watermark Text:
            </label>
            <input
              type="text"
              className="search-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. COPYRIGHT, SAMPLE, DRAFT"
              style={{ width: '100%', padding: '0.6rem 0.85rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Position:
              </label>
              <select
                className="search-input"
                value={position}
                onChange={(e) => setPosition(e.target.value as any)}
                style={{ width: '100%', padding: '0.5rem' }}
              >
                <option value="center">Center</option>
                <option value="top-left">Top Left</option>
                <option value="top-right">Top Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="bottom-right">Bottom Right</option>
                <option value="tile">Diagonal Tiled Grid</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Font Size: {fontSize}px
              </label>
              <input
                type="range"
                min="16"
                max="96"
                step="4"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Opacity: {Math.round(textOpacity * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={textOpacity}
                onChange={(e) => setTextOpacity(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Text Color:
              </label>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                style={{ width: '100%', height: '36px', borderRadius: '4px', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Select Logo Image (PNG / SVG):
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              style={{ fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Logo Position:
              </label>
              <select
                className="search-input"
                value={position === 'tile' ? 'bottom-right' : position}
                onChange={(e) => setPosition(e.target.value as any)}
                style={{ width: '100%', padding: '0.5rem' }}
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="top-right">Top Right</option>
                <option value="top-left">Top Left</option>
                <option value="center">Center</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Logo Scale: {Math.round(logoScale * 100)}% of width
              </label>
              <input
                type="range"
                min="0.05"
                max="0.6"
                step="0.05"
                value={logoScale}
                onChange={(e) => setLogoScale(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                Logo Opacity: {Math.round(logoOpacity * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={logoOpacity}
                onChange={(e) => setLogoOpacity(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <ToolWorkspace
      processor={processor}
      acceptedTypes={['image/*', '.jpg', '.jpeg', '.png', '.webp']}
      supportsMultipleFiles={false}
      maxSizeMb={50}
      dropzoneTitle="Drop an image to apply text or logo branding watermark"
      actionLabel="Apply Watermark"
      onExecute={handleWatermark}
      options={watermarkOptions}
      resultTitle="Watermark Stamped"
    />
  )
}

// ============================================================================
// 7. IMAGE ENHANCER & FILTER STUDIO VIEW
// ============================================================================
export const ImageEnhanceView: React.FC = () => {
  const [brightness, setBrightness] = useState<number>(0)
  const [contrast, setContrast] = useState<number>(0)
  const [saturation, setSaturation] = useState<number>(0)
  const [exposure, setExposure] = useState<number>(0)
  const [sharpness, setSharpness] = useState<number>(0)
  const [sepia, setSepia] = useState<number>(0)
  const [grayscale, setGrayscale] = useState<number>(0)

  const processor = useFileProcessor({
    acceptedTypes: ['image/*', '.jpg', '.jpeg', '.png', '.webp'],
    supportsMultipleFiles: false,
    maxSizeMb: 50,
  })

  const resetAll = () => {
    setBrightness(0)
    setContrast(0)
    setSaturation(0)
    setExposure(0)
    setSharpness(0)
    setSepia(0)
    setGrayscale(0)
  }

  const applyPreset = (name: string) => {
    resetAll()
    if (name === 'vivid') {
      setSaturation(40)
      setContrast(20)
      setSharpness(25)
    } else if (name === 'dramatic') {
      setContrast(45)
      setExposure(-10)
      setSharpness(40)
    } else if (name === 'bw') {
      setGrayscale(100)
      setContrast(25)
    } else if (name === 'sepia') {
      setSepia(80)
      setBrightness(-5)
    } else if (name === 'cool') {
      setBrightness(5)
      setSaturation(15)
    } else if (name === 'warm') {
      setSepia(30)
      setBrightness(5)
      setSaturation(20)
    }
  }

  const handleEnhance = () => {
    processor.startProcessing({}, {
      validate: (files) => {
        if (!files[0]) return { valid: false, error: 'Please choose an image.' }
        return { valid: true }
      },
      process: async (files, _opts, onProgress, signal) => {
        if (signal?.aborted) throw new DOMException('Operation cancelled', 'AbortError')

        onProgress({ isIndeterminate: true, stage: 'Applying pixel enhancements and sharpness kernel...' })
        const blob = await enhanceImage(files[0], {
          brightness,
          contrast,
          saturation,
          exposure,
          sharpness,
          sepia,
          grayscale,
        })

        const baseName = files[0].name.replace(/\.[^/.]+$/, '')
        return {
          blob,
          downloadName: `${baseName}_enhanced.png`,
          mimeType: 'image/png',
          sizeBytes: blob.size,
          previewUrl: URL.createObjectURL(blob),
        }
      },
    })
  }

  const enhanceOptions = processor.files.length > 0 && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Preset Buttons */}
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
          One-Click Presets:
        </label>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { id: 'vivid', label: 'Vivid' },
            { id: 'dramatic', label: 'Dramatic' },
            { id: 'bw', label: 'B & W' },
            { id: 'sepia', label: 'Vintage Sepia' },
            { id: 'warm', label: 'Warm Glow' },
            { id: 'cool', label: 'Cool Tones' },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => applyPreset(p.id)}
            >
              {p.label}
            </button>
          ))}
          <button type="button" className="btn btn-secondary btn-sm" onClick={resetAll}>
            Reset All
          </button>
        </div>
      </div>

      {/* Adjustment Sliders Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.2rem' }}>
            <span>Brightness</span>
            <span>{brightness > 0 ? `+${brightness}` : brightness}</span>
          </div>
          <input
            type="range"
            min="-80"
            max="80"
            value={brightness}
            onChange={(e) => setBrightness(parseInt(e.target.value, 10))}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.2rem' }}>
            <span>Contrast</span>
            <span>{contrast > 0 ? `+${contrast}` : contrast}</span>
          </div>
          <input
            type="range"
            min="-80"
            max="80"
            value={contrast}
            onChange={(e) => setContrast(parseInt(e.target.value, 10))}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.2rem' }}>
            <span>Saturation</span>
            <span>{saturation > 0 ? `+${saturation}` : saturation}</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={saturation}
            onChange={(e) => setSaturation(parseInt(e.target.value, 10))}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.2rem' }}>
            <span>Sharpness (3x3 Kernel)</span>
            <span>{sharpness}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={sharpness}
            onChange={(e) => setSharpness(parseInt(e.target.value, 10))}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.2rem' }}>
            <span>Exposure</span>
            <span>{exposure > 0 ? `+${exposure}` : exposure}</span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            value={exposure}
            onChange={(e) => setExposure(parseInt(e.target.value, 10))}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.2rem' }}>
            <span>Vintage Sepia</span>
            <span>{sepia}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={sepia}
            onChange={(e) => setSepia(parseInt(e.target.value, 10))}
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </div>
  )

  return (
    <ToolWorkspace
      processor={processor}
      acceptedTypes={['image/*', '.jpg', '.jpeg', '.png', '.webp']}
      supportsMultipleFiles={false}
      maxSizeMb={50}
      dropzoneTitle="Drop an image to fine-tune brightness, contrast, and sharpness"
      actionLabel="Apply Enhancements"
      onExecute={handleEnhance}
      options={enhanceOptions}
      resultTitle="Image Enhanced"
    />
  )
}

// ============================================================================
// 8. BACKGROUND REMOVER VIEW (COLOR-KEY & FEASIBILITY DISCLOSURE)
// ============================================================================
export const ImageBackgroundRemoveView: React.FC = () => {
  const [targetColor, setTargetColor] = useState<string>('#ffffff')
  const [tolerance, setTolerance] = useState<number>(35)
  const [softness, setSoftness] = useState<number>(15)

  const processor = useFileProcessor({
    acceptedTypes: ['image/*', '.jpg', '.jpeg', '.png', '.webp'],
    supportsMultipleFiles: false,
    maxSizeMb: 50,
  })

  const handleRemoveBg = () => {
    processor.startProcessing({}, {
      validate: (files) => {
        if (!files[0]) return { valid: false, error: 'Please select an image.' }
        return { valid: true }
      },
      process: async (files, _opts, onProgress, signal) => {
        if (signal?.aborted) throw new DOMException('Operation cancelled', 'AbortError')

        onProgress({ isIndeterminate: true, stage: 'Calculating alpha distance mask...' })
        const blob = await removeColorBackground(files[0], {
          targetColorHex: targetColor,
          tolerance,
          softness,
        })

        const baseName = files[0].name.replace(/\.[^/.]+$/, '')
        return {
          blob,
          downloadName: `${baseName}_nobg.png`,
          mimeType: 'image/png',
          sizeBytes: blob.size,
          previewUrl: URL.createObjectURL(blob),
        }
      },
    })
  }

  const bgOptions = processor.files.length > 0 && (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ padding: '0.85rem', background: 'rgba(59, 130, 246, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
        <strong>Pure Client-Side Alpha Matte:</strong> Removes solid, studio, white, or green-screen backgrounds instantly using Euclidean RGB color distance. Adjust tolerance and edge softness to get a clean transparent PNG cutout.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
            Background Color to Remove:
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="color"
              value={targetColor}
              onChange={(e) => setTargetColor(e.target.value)}
              style={{ width: '40px', height: '40px', borderRadius: '4px', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {[
                { hex: '#ffffff', name: 'White' },
                { hex: '#00ff00', name: 'Green' },
                { hex: '#000000', name: 'Black' },
                { hex: '#0000ff', name: 'Blue' },
              ].map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setTargetColor(c.hex)}
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.2rem' }}>
            <span>Color Tolerance (Threshold)</span>
            <span>{tolerance}</span>
          </div>
          <input
            type="range"
            min="10"
            max="120"
            value={tolerance}
            onChange={(e) => setTolerance(parseInt(e.target.value, 10))}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.2rem' }}>
            <span>Edge Softness (Feathering)</span>
            <span>{softness}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="40"
            value={softness}
            onChange={(e) => setSoftness(parseInt(e.target.value, 10))}
            style={{ width: '100%' }}
          />
        </div>
      </div>
    </div>
  )

  return (
    <ToolWorkspace
      processor={processor}
      acceptedTypes={['image/*', '.jpg', '.jpeg', '.png', '.webp']}
      supportsMultipleFiles={false}
      maxSizeMb={50}
      dropzoneTitle="Drop photo to remove solid, white, or green studio background"
      actionLabel="Remove Background"
      onExecute={handleRemoveBg}
      options={bgOptions}
      resultTitle="Transparent PNG Generated"
    />
  )
}

// ============================================================================
// 9. COLOR PALETTE VIEW
// ============================================================================
export const ColorPaletteView: React.FC = () => {
  const [colors, setColors] = useState<string[]>([])
  const [copiedHex, setCopiedHex] = useState<string | null>(null)

  const processor = useFileProcessor({
    acceptedTypes: ['image/*'],
    supportsMultipleFiles: false,
    maxSizeMb: 40,
  })

  const handleExtract = () => {
    processor.startProcessing({}, {
      validate: (files) => {
        if (!files[0]) return { valid: false, error: 'Please choose an image.' }
        return { valid: true }
      },
      process: async (files, _opts, onProgress, signal) => {
        if (signal?.aborted) throw new DOMException('Operation cancelled', 'AbortError')

        onProgress({ isIndeterminate: true, stage: 'Quantizing pixel colors...' })
        const palette = await extractColorPalette(files[0], 8)
        setColors(palette)

        const paletteText = palette.join('\n')
        const blob = new Blob([paletteText], { type: 'text/plain' })

        return {
          blob,
          downloadName: 'palette.txt',
          mimeType: 'text/plain',
          sizeBytes: blob.size,
          data: paletteText,
        }
      },
    })
  }

  const copyHex = (hex: string) => {
    navigator.clipboard.writeText(hex)
    setCopiedHex(hex)
    setTimeout(() => setCopiedHex(null), 1500)
  }

  return (
    <ToolWorkspace
      processor={processor}
      acceptedTypes={['image/*']}
      supportsMultipleFiles={false}
      maxSizeMb={40}
      dropzoneTitle="Drop an image to extract dominant color palette & HEX codes"
      actionLabel="Extract Color Palette"
      onExecute={handleExtract}
      resultTitle="Dominant Colors Extracted"
      options={
        colors.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.75rem' }}>
            {colors.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => copyHex(hex)}
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
                    height: '50px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: hex,
                    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)',
                  }}
                />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600 }}>
                  {hex.toUpperCase()}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  {copiedHex === hex ? <Check size={11} color="var(--accent-emerald)" /> : <Copy size={11} />}
                  {copiedHex === hex ? 'Copied' : 'Copy'}
                </span>
              </button>
            ))}
          </div>
        ) : undefined
      }
    />
  )
}

// ============================================================================
// 10. EXIF METADATA STRIPPER VIEW
// ============================================================================
export const ExifStripperView: React.FC = () => {
  const processor = useFileProcessor({
    acceptedTypes: ['image/jpeg', 'image/png', '.jpg', '.jpeg', '.png'],
    supportsMultipleFiles: false,
    maxSizeMb: 50,
  })

  const handleStrip = () => {
    processor.startProcessing({}, {
      validate: (files) => {
        if (!files[0]) return { valid: false, error: 'Please choose an image.' }
        return { valid: true }
      },
      process: async (files, _opts, onProgress, signal) => {
        if (signal?.aborted) throw new DOMException('Operation cancelled', 'AbortError')

        onProgress({ isIndeterminate: true, stage: 'Stripping camera EXIF, GPS, and date tags...' })
        const blob = await stripExifMetadata(files[0])
        const baseName = files[0].name.replace(/\.[^/.]+$/, '')
        const ext = files[0].type === 'image/png' ? 'png' : 'jpg'

        return {
          blob,
          downloadName: `sanitized_${baseName}.${ext}`,
          mimeType: files[0].type,
          sizeBytes: blob.size,
          previewUrl: URL.createObjectURL(blob),
        }
      },
    })
  }

  return (
    <ToolWorkspace
      processor={processor}
      acceptedTypes={['image/jpeg', 'image/png', '.jpg', '.jpeg', '.png']}
      supportsMultipleFiles={false}
      maxSizeMb={50}
      dropzoneTitle="Drop photo to remove hidden EXIF, GPS coordinates, and camera metadata"
      actionLabel="Sanitize & Strip EXIF"
      onExecute={handleStrip}
      resultTitle="EXIF Metadata Stripped"
      options={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', color: 'var(--accent-emerald)' }}>
          <ShieldCheck size={18} />
          <span>Guaranteed pure re-encoding: strips GPS coordinates, serial numbers, camera model, and timestamp tags.</span>
        </div>
      }
    />
  )
}
