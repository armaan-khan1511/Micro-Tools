import React, { useState, useEffect } from 'react'
import {
  FileVideo,
  Music,
  Scissors,
  Volume2,
  Film,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import {
  trimAudio,
  normalizeAudioVolume,
  compressVideo,
  convertVideo,
  videoToGif,
  extractAudioFromVideo,
  convertAudio,
} from '../../core/engine/audio-video/audioVideoEngine'
import { FileDropZone } from '../../components/upload/FileDropZone'
import { ProgressBar } from '../../components/common/ProgressBar'
import { triggerFileDownload, formatBytes } from '../../services/file/fileUtils'

// ============================================================================
// 1. VIDEO COMPRESSOR VIEW
// ============================================================================
export const VideoCompressView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState<'mp4' | 'webm'>('mp4')
  const [resolution, setResolution] = useState<'original' | '1080p' | '720p' | '480p' | '360p'>('720p')
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('medium')
  const [keepAudio, setKeepAudio] = useState(true)

  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Object URL cleanup
  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl)
    }
  }, [resultUrl])

  const handleCompress = async () => {
    if (!file) return
    try {
      setError(null)
      setIsProcessing(true)
      setProgress(5)
      setStatus('Initializing video compression pipeline...')

      const blob = await compressVideo(
        file,
        { format, resolution, quality, keepAudio },
        (p, s) => {
          setProgress(p)
          setStatus(s)
        }
      )

      if (resultUrl) URL.revokeObjectURL(resultUrl)
      const url = URL.createObjectURL(blob)
      setResultBlob(blob)
      setResultUrl(url)
    } catch (err: any) {
      setError(err.message || 'Video compression failed.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl)
    setFile(null)
    setResultBlob(null)
    setResultUrl(null)
    setError(null)
  }

  const savingsPercent =
    file && resultBlob ? Math.round(((file.size - resultBlob.size) / file.size) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Banner Notice */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.85rem 1.25rem',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <span className="badge badge-purple" style={{ fontWeight: 700 }}>
          [Client-Side WASM Engine]
        </span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Compresses video frames in-browser using WebAssembly. Runs single-threaded for universal compatibility.
        </span>
      </div>

      {!file ? (
        <FileDropZone
          acceptedTypes={['video/*', '.mp4', '.webm', '.mov', '.mkv']}
          onFilesSelected={(files) => files[0] && setFile(files[0])}
          title="Drop video file (MP4, WebM, MOV, MKV) to compress"
          supportsMultipleFiles={false}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* File Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileVideo size={20} color="var(--accent-primary)" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{file.name}</h3>
              </div>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Original Size: <strong>{formatBytes(file.size)}</strong>
              </p>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleReset} disabled={isProcessing}>
              <RefreshCw size={14} /> Change Video
            </button>
          </div>

          {/* Large file memory warning */}
          {file.size > 50 * 1024 * 1024 && (
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start',
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid var(--accent-amber, #f59e0b)',
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
              }}
            >
              <AlertTriangle size={18} color="var(--accent-amber, #f59e0b)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Large File Notice ({formatBytes(file.size)}):</strong> In-browser WebAssembly operates within browser memory limits (~100–200MB RAM). Transcoding this file may take several minutes.
              </div>
            </div>
          )}

          {/* Options Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              padding: '1.25rem',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Output Container:
              </label>
              <select
                className="search-input"
                style={{ width: '100%' }}
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                disabled={isProcessing}
              >
                <option value="mp4">MP4 (H.264 - Universal)</option>
                <option value="webm">WebM (VP9 - High Efficiency)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Target Resolution:
              </label>
              <select
                className="search-input"
                style={{ width: '100%' }}
                value={resolution}
                onChange={(e) => setResolution(e.target.value as any)}
                disabled={isProcessing}
              >
                <option value="original">Original Dimensions</option>
                <option value="1080p">1080p (Full HD)</option>
                <option value="720p">720p (HD Recommended)</option>
                <option value="480p">480p (Standard Definition)</option>
                <option value="360p">360p (Compact / Mobile)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Compression Quality:
              </label>
              <select
                className="search-input"
                style={{ width: '100%' }}
                value={quality}
                onChange={(e) => setQuality(e.target.value as any)}
                disabled={isProcessing}
              >
                <option value="high">High Quality (Low Compression)</option>
                <option value="medium">Balanced (Recommended)</option>
                <option value="low">Smallest File (Aggressive)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Audio Track:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', height: '38px' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={keepAudio}
                    onChange={(e) => setKeepAudio(e.target.checked)}
                    disabled={isProcessing}
                  />
                  <span>Retain Sound Track</span>
                </label>
              </div>
            </div>
          </div>

          {/* Progress or Error */}
          {isProcessing && <ProgressBar progress={progress} statusText={status} />}
          {error && (
            <div style={{ padding: '0.85rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-rose)', borderRadius: 'var(--radius-md)', color: 'var(--accent-rose)', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {/* Action Trigger */}
          {!resultBlob && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCompress}
                disabled={isProcessing}
                style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}
              >
                {isProcessing ? 'Compressing Video...' : 'Compress Video'}
              </button>
            </div>
          )}

          {/* Results Card */}
          {resultBlob && resultUrl && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                padding: '1.25rem',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--accent-emerald, #10b981)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={20} color="var(--accent-emerald, #10b981)" />
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>Compression Complete!</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {formatBytes(file.size)} → <strong>{formatBytes(resultBlob.size)}</strong>
                  </span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: savingsPercent >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: savingsPercent >= 0 ? 'var(--accent-emerald, #10b981)' : 'var(--accent-rose)',
                    }}
                  >
                    {savingsPercent >= 0 ? `-${savingsPercent}% smaller` : `+${Math.abs(savingsPercent)}%`}
                  </span>
                </div>
              </div>

              {/* Preview Player */}
              <div style={{ maxWidth: '540px', margin: '0 auto', width: '100%' }}>
                <video
                  src={resultUrl}
                  controls
                  style={{ width: '100%', borderRadius: 'var(--radius-md)', maxHeight: '360px', backgroundColor: '#000' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    triggerFileDownload(
                      resultBlob,
                      `compressed_${file.name.replace(/\.[^/.]+$/, '')}.${format}`
                    )
                  }
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Download size={15} /> Download Compressed Video
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 2. VIDEO CONVERTER VIEW
// ============================================================================
export const VideoConverterView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [targetFormat, setTargetFormat] = useState<'mp4' | 'webm' | 'mov' | 'mkv'>('mp4')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl)
    }
  }, [resultUrl])

  const handleConvert = async () => {
    if (!file) return
    try {
      setError(null)
      setIsProcessing(true)
      const blob = await convertVideo(file, targetFormat, (p, s) => {
        setProgress(p)
        setStatus(s)
      })

      if (resultUrl) URL.revokeObjectURL(resultUrl)
      const url = URL.createObjectURL(blob)
      setResultBlob(blob)
      setResultUrl(url)
    } catch (err: any) {
      setError(err.message || 'Video conversion failed.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.85rem 1.25rem',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <span className="badge badge-purple" style={{ fontWeight: 700 }}>
          [Format Transcoder]
        </span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Transcodes between MP4, WebM, QuickTime MOV, and Matroska MKV using FFmpeg WebAssembly.
        </span>
      </div>

      {!file ? (
        <FileDropZone
          acceptedTypes={['video/*', '.mp4', '.webm', '.mov', '.mkv', '.avi']}
          onFilesSelected={(files) => files[0] && setFile(files[0])}
          title="Drop any video file to transcode container format"
          supportsMultipleFiles={false}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Film size={20} color="var(--accent-primary)" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{file.name}</h3>
              </div>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Size: {formatBytes(file.size)}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                if (resultUrl) URL.revokeObjectURL(resultUrl)
                setFile(null)
                setResultBlob(null)
                setResultUrl(null)
              }}
              disabled={isProcessing}
            >
              <RefreshCw size={14} /> Change Video
            </button>
          </div>

          <div
            style={{
              padding: '1.25rem',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Select Output Format:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
              {(['mp4', 'webm', 'mov', 'mkv'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setTargetFormat(fmt)}
                  className={`btn ${targetFormat === fmt ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ textTransform: 'uppercase', fontWeight: 700 }}
                  disabled={isProcessing}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {isProcessing && <ProgressBar progress={progress} statusText={status} />}
          {error && <div style={{ color: 'var(--accent-rose)', fontSize: '0.85rem' }}>{error}</div>}

          {!resultBlob && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConvert}
                disabled={isProcessing}
                style={{ padding: '0.75rem 1.5rem' }}
              >
                {isProcessing ? 'Converting...' : `Convert to ${targetFormat.toUpperCase()}`}
              </button>
            </div>
          )}

          {resultBlob && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.25rem',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--accent-emerald, #10b981)',
              }}
            >
              <div>
                <span style={{ fontWeight: 700, color: 'var(--accent-emerald, #10b981)' }}>
                  Conversion Successful!
                </span>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Output size: {formatBytes(resultBlob.size)}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  triggerFileDownload(
                    resultBlob,
                    `${file.name.replace(/\.[^/.]+$/, '')}.${targetFormat}`
                  )
                }
              >
                <Download size={15} /> Download {targetFormat.toUpperCase()}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 3. VIDEO TO GIF VIEW
// ============================================================================
export const VideoToGifView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(5)
  const [width, setWidth] = useState(480)
  const [fps, setFps] = useState(15)

  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [gifBlob, setGifBlob] = useState<Blob | null>(null)
  const [gifUrl, setGifUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (gifUrl) URL.revokeObjectURL(gifUrl)
    }
  }, [gifUrl])

  const handleCreateGif = async () => {
    if (!file) return
    try {
      setError(null)
      setIsProcessing(true)
      const blob = await videoToGif(file, { startTime, endTime, width, fps }, (p, s) => {
        setProgress(p)
        setStatus(s)
      })

      if (gifUrl) URL.revokeObjectURL(gifUrl)
      const url = URL.createObjectURL(blob)
      setGifBlob(blob)
      setGifUrl(url)
    } catch (err: any) {
      setError(err.message || 'Failed to generate GIF.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          padding: '0.85rem 1rem',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid var(--accent-amber, #f59e0b)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.85rem',
          color: 'var(--text-primary)',
        }}
      >
        <AlertTriangle size={18} color="var(--accent-amber, #f59e0b)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>Animated GIF Size Advisory:</strong> GIFs are uncompressed raster frames and can easily become much larger than the original compressed MP4. Keep duration under 10s and resolution under 480px for manageable file sizes.
        </div>
      </div>

      {!file ? (
        <FileDropZone
          acceptedTypes={['video/*', '.mp4', '.webm', '.mov']}
          onFilesSelected={(files) => files[0] && setFile(files[0])}
          title="Drop video clip to convert into high-quality animated GIF"
          supportsMultipleFiles={false}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Film size={20} color="var(--accent-primary)" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{file.name}</h3>
              </div>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {formatBytes(file.size)}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                if (gifUrl) URL.revokeObjectURL(gifUrl)
                setFile(null)
                setGifBlob(null)
                setGifUrl(null)
              }}
              disabled={isProcessing}
            >
              <RefreshCw size={14} /> Change Video
            </button>
          </div>

          {/* Time & Dimension Controls */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '1rem',
              padding: '1.25rem',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Start Time (sec):
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                className="search-input"
                value={startTime}
                onChange={(e) => setStartTime(Math.max(0, parseFloat(e.target.value) || 0))}
                disabled={isProcessing}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                End Time (sec):
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                className="search-input"
                value={endTime}
                onChange={(e) => setEndTime(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
                disabled={isProcessing}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                GIF Width:
              </label>
              <select
                className="search-input"
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value, 10))}
                disabled={isProcessing}
              >
                <option value={320}>320px (Compact / Fast)</option>
                <option value={480}>480px (Standard Balanced)</option>
                <option value={640}>640px (Crisp / Large)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Frame Rate:
              </label>
              <select
                className="search-input"
                value={fps}
                onChange={(e) => setFps(parseInt(e.target.value, 10))}
                disabled={isProcessing}
              >
                <option value={10}>10 FPS (Low Size)</option>
                <option value={15}>15 FPS (Smooth Standard)</option>
                <option value={24}>24 FPS (Ultra Fluid)</option>
              </select>
            </div>
          </div>

          {isProcessing && <ProgressBar progress={progress} statusText={status} />}
          {error && <div style={{ color: 'var(--accent-rose)', fontSize: '0.85rem' }}>{error}</div>}

          {!gifBlob && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCreateGif}
                disabled={isProcessing}
                style={{ padding: '0.75rem 1.5rem' }}
              >
                {isProcessing ? 'Generating GIF...' : 'Generate Animated GIF'}
              </button>
            </div>
          )}

          {gifBlob && gifUrl && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                padding: '1.25rem',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--accent-emerald, #10b981)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--accent-emerald, #10b981)' }}>
                  Animated GIF Generated ({formatBytes(gifBlob.size)})
                </span>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    triggerFileDownload(gifBlob, `${file.name.replace(/\.[^/.]+$/, '')}.gif`)
                  }
                >
                  <Download size={15} /> Download GIF
                </button>
              </div>

              <div style={{ textAlign: 'center', background: '#111', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <img src={gifUrl} alt="Generated GIF" style={{ maxWidth: '100%', maxHeight: '350px' }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 4. VIDEO AUDIO EXTRACTOR VIEW
// ============================================================================
export const VideoAudioExtractView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState<'wav' | 'mp3'>('wav')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const handleExtract = async () => {
    if (!file) return
    try {
      setError(null)
      setIsProcessing(true)
      const blob = await extractAudioFromVideo(file, format, (p, s) => {
        setProgress(p)
        setStatus(s)
      })

      if (audioUrl) URL.revokeObjectURL(audioUrl)
      const url = URL.createObjectURL(blob)
      setAudioBlob(blob)
      setAudioUrl(url)
    } catch (err: any) {
      setError(err.message || 'Failed to extract audio track.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.85rem 1.25rem',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <span className="badge badge-green" style={{ fontWeight: 700 }}>
          [Sound Track Demuxer]
        </span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Rips genuine digital sound streams from MP4, WebM, and MOV containers. Choose between instant lossless WAV or standard MP3.
        </span>
      </div>

      {!file ? (
        <FileDropZone
          acceptedTypes={['video/*', '.mp4', '.webm', '.mov', '.mkv']}
          onFilesSelected={(files) => files[0] && setFile(files[0])}
          title="Drop video file (MP4, WebM, MOV) to extract sound track"
          supportsMultipleFiles={false}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileVideo size={20} color="var(--accent-primary)" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{file.name}</h3>
              </div>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {formatBytes(file.size)}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                if (audioUrl) URL.revokeObjectURL(audioUrl)
                setFile(null)
                setAudioBlob(null)
                setAudioUrl(null)
              }}
              disabled={isProcessing}
            >
              <RefreshCw size={14} /> Change Video
            </button>
          </div>

          <div
            style={{
              padding: '1.25rem',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Output Audio Format:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <button
                type="button"
                className={`btn ${format === 'wav' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFormat('wav')}
                disabled={isProcessing}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0.75rem 1rem' }}
              >
                <strong style={{ fontSize: '0.95rem' }}>WAV (Instant Lossless)</strong>
                <span style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.2rem' }}>
                  Native Web Audio API • 0MB download • Works offline
                </span>
              </button>

              <button
                type="button"
                className={`btn ${format === 'mp3' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFormat('mp3')}
                disabled={isProcessing}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0.75rem 1rem' }}
              >
                <strong style={{ fontSize: '0.95rem' }}>MP3 (Compact Standard)</strong>
                <span style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.2rem' }}>
                  Encoded via FFmpeg WASM • Universal mobile player playback
                </span>
              </button>
            </div>
          </div>

          {isProcessing && <ProgressBar progress={progress} statusText={status} />}
          {error && <div style={{ color: 'var(--accent-rose)', fontSize: '0.85rem' }}>{error}</div>}

          {!audioBlob && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleExtract}
                disabled={isProcessing}
                style={{ padding: '0.75rem 1.5rem' }}
              >
                {isProcessing ? 'Extracting Audio...' : `Extract Sound Track (${format.toUpperCase()})`}
              </button>
            </div>
          )}

          {audioBlob && audioUrl && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                padding: '1.25rem',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--accent-emerald, #10b981)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--accent-emerald, #10b981)' }}>
                  Audio Track Extracted ({formatBytes(audioBlob.size)})
                </span>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    triggerFileDownload(
                      audioBlob,
                      `soundtrack_${file.name.replace(/\.[^/.]+$/, '')}.${format}`
                    )
                  }
                >
                  <Download size={15} /> Download {format.toUpperCase()}
                </button>
              </div>

              <audio src={audioUrl} controls style={{ width: '100%' }} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 5. AUDIO CONVERTER VIEW
// ============================================================================
export const AudioConverterView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [targetFormat, setTargetFormat] = useState<'wav' | 'mp3' | 'aac' | 'ogg'>('mp3')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl)
    }
  }, [resultUrl])

  const handleConvert = async () => {
    if (!file) return
    try {
      setError(null)
      setIsProcessing(true)
      const blob = await convertAudio(file, targetFormat, (p, s) => {
        setProgress(p)
        setStatus(s)
      })

      if (resultUrl) URL.revokeObjectURL(resultUrl)
      const url = URL.createObjectURL(blob)
      setResultBlob(blob)
      setResultUrl(url)
    } catch (err: any) {
      setError(err.message || 'Audio conversion failed.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.85rem 1.25rem',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <span className="badge badge-blue" style={{ fontWeight: 700 }}>
          [Audio Transcoder]
        </span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Transcodes between MP3, WAV, AAC, and OGG formats with genuine client-side encoding.
        </span>
      </div>

      {!file ? (
        <FileDropZone
          acceptedTypes={['audio/*', '.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac']}
          onFilesSelected={(files) => files[0] && setFile(files[0])}
          title="Drop any audio track to convert format"
          supportsMultipleFiles={false}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Music size={20} color="var(--accent-primary)" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{file.name}</h3>
              </div>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Original: {formatBytes(file.size)}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                if (resultUrl) URL.revokeObjectURL(resultUrl)
                setFile(null)
                setResultBlob(null)
                setResultUrl(null)
              }}
              disabled={isProcessing}
            >
              <RefreshCw size={14} /> Change Audio
            </button>
          </div>

          <div
            style={{
              padding: '1.25rem',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Select Destination Audio Format:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
              {(
                [
                  { id: 'wav', name: 'WAV', desc: '16-bit PCM Lossless (Instant)' },
                  { id: 'mp3', name: 'MP3', desc: 'LAME High Quality' },
                  { id: 'aac', name: 'AAC', desc: 'M4A Standard (192k)' },
                  { id: 'ogg', name: 'OGG', desc: 'Vorbis Open Codec' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setTargetFormat(f.id)}
                  className={`btn ${targetFormat === f.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0.65rem 0.85rem' }}
                  disabled={isProcessing}
                >
                  <strong style={{ fontSize: '0.95rem' }}>{f.name}</strong>
                  <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>{f.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {isProcessing && <ProgressBar progress={progress} statusText={status} />}
          {error && <div style={{ color: 'var(--accent-rose)', fontSize: '0.85rem' }}>{error}</div>}

          {!resultBlob && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConvert}
                disabled={isProcessing}
                style={{ padding: '0.75rem 1.5rem' }}
              >
                {isProcessing ? 'Converting...' : `Convert to ${targetFormat.toUpperCase()}`}
              </button>
            </div>
          )}

          {resultBlob && resultUrl && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                padding: '1.25rem',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--accent-emerald, #10b981)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--accent-emerald, #10b981)' }}>
                  Audio Converted to {targetFormat.toUpperCase()} ({formatBytes(resultBlob.size)})
                </span>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    triggerFileDownload(
                      resultBlob,
                      `${file.name.replace(/\.[^/.]+$/, '')}.${targetFormat}`
                    )
                  }
                >
                  <Download size={15} /> Download {targetFormat.toUpperCase()}
                </button>
              </div>

              <audio src={resultUrl} controls style={{ width: '100%' }} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 6. AUDIO TRIMMER VIEW
// ============================================================================
export const AudioTrimmerView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [startSec, setStartSec] = useState(0)
  const [endSec, setEndSec] = useState(30)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [trimmedBlob, setTrimmedBlob] = useState<Blob | null>(null)
  const [trimmedUrl, setTrimmedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (trimmedUrl) URL.revokeObjectURL(trimmedUrl)
    }
  }, [trimmedUrl])

  // Probe audio duration when selected
  useEffect(() => {
    if (!file) {
      setDuration(null)
      return
    }
    const audio = new Audio()
    const url = URL.createObjectURL(file)
    audio.src = url
    audio.onloadedmetadata = () => {
      const dur = Math.round(audio.duration)
      setDuration(dur)
      setEndSec(Math.min(dur, 30))
      URL.revokeObjectURL(url)
    }
    audio.onerror = () => {
      URL.revokeObjectURL(url)
    }
  }, [file])

  const handleTrim = async () => {
    if (!file) return
    try {
      setError(null)
      setIsProcessing(true)
      const res = await trimAudio(file, startSec, endSec, (p, s) => {
        setProgress(p)
        setStatus(s)
      })

      if (trimmedUrl) URL.revokeObjectURL(trimmedUrl)
      const url = URL.createObjectURL(res.blob)
      setTrimmedBlob(res.blob)
      setTrimmedUrl(url)
    } catch (err: any) {
      setError(err.message || 'Failed to trim audio.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.85rem 1.25rem',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <span className="badge badge-emerald" style={{ fontWeight: 700 }}>
          [Native Web Audio API]
        </span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Lightning-fast sample-accurate audio trimming directly in browser memory. 0MB download, instant output.
        </span>
      </div>

      {!file ? (
        <FileDropZone
          acceptedTypes={['audio/*', '.mp3', '.wav', '.ogg', '.m4a', '.aac']}
          onFilesSelected={(files) => files[0] && setFile(files[0])}
          title="Drop audio file to cut / slice / trim"
          supportsMultipleFiles={false}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Scissors size={20} color="var(--accent-primary)" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{file.name}</h3>
              </div>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {formatBytes(file.size)} {duration !== null && `• Duration: ${Math.floor(duration / 60)}m ${Math.round(duration % 60)}s`}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                if (trimmedUrl) URL.revokeObjectURL(trimmedUrl)
                setFile(null)
                setTrimmedBlob(null)
                setTrimmedUrl(null)
              }}
              disabled={isProcessing}
            >
              <RefreshCw size={14} /> Change Audio
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              padding: '1.25rem',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Start Timestamp (seconds):
              </label>
              <input
                type="number"
                min="0"
                max={duration || 9999}
                step="0.5"
                className="search-input"
                value={startSec}
                onChange={(e) => setStartSec(Math.max(0, parseFloat(e.target.value) || 0))}
                disabled={isProcessing}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                End Timestamp (seconds):
              </label>
              <input
                type="number"
                min={startSec + 0.5}
                max={duration || 9999}
                step="0.5"
                className="search-input"
                value={endSec}
                onChange={(e) => setEndSec(Math.max(startSec + 0.1, parseFloat(e.target.value) || 1))}
                disabled={isProcessing}
              />
            </div>
          </div>

          {isProcessing && <ProgressBar progress={progress} statusText={status} />}
          {error && <div style={{ color: 'var(--accent-rose)', fontSize: '0.85rem' }}>{error}</div>}

          {!trimmedBlob && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleTrim}
                disabled={isProcessing}
                style={{ padding: '0.75rem 1.5rem' }}
              >
                {isProcessing ? 'Trimming...' : `Trim Segment (${startSec}s - ${endSec}s)`}
              </button>
            </div>
          )}

          {trimmedBlob && trimmedUrl && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                padding: '1.25rem',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--accent-emerald, #10b981)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--accent-emerald, #10b981)' }}>
                  Trimmed Audio Clip ({formatBytes(trimmedBlob.size)})
                </span>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    triggerFileDownload(
                      trimmedBlob,
                      `trimmed_${startSec}_${endSec}_${file.name.replace(/\.[^/.]+$/, '')}.wav`
                    )
                  }
                >
                  <Download size={15} /> Download Trimmed WAV
                </button>
              </div>

              <audio src={trimmedUrl} controls style={{ width: '100%' }} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 7. AUDIO VOLUME NORMALIZER VIEW
// ============================================================================
export const AudioNormalizerView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [targetPeakDb, setTargetPeakDb] = useState<number>(-1.0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [result, setResult] = useState<{
    blob: Blob
    originalPeakDb: number
    targetPeakDb: number
    gainAppliedDb: number
    duration: number
  } | null>(null)
  const [normalizedUrl, setNormalizedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (normalizedUrl) URL.revokeObjectURL(normalizedUrl)
    }
  }, [normalizedUrl])

  const handleNormalize = async () => {
    if (!file) return
    try {
      setError(null)
      setIsProcessing(true)
      const res = await normalizeAudioVolume(file, targetPeakDb, (p, s) => {
        setProgress(p)
        setStatus(s)
      })

      if (normalizedUrl) URL.revokeObjectURL(normalizedUrl)
      const url = URL.createObjectURL(res.blob)
      setResult(res)
      setNormalizedUrl(url)
    } catch (err: any) {
      setError(err.message || 'Failed to normalize audio volume.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.85rem 1.25rem',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <span className="badge badge-emerald" style={{ fontWeight: 700 }}>
          [Native Web Audio Normalizer]
        </span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Accurate peak sample normalization directly in browser memory. Eliminates quiet audio tracks and prevents digital clipping.
        </span>
      </div>

      {!file ? (
        <FileDropZone
          acceptedTypes={['audio/*', '.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac']}
          onFilesSelected={(files) => files[0] && setFile(files[0])}
          title="Drop audio file to balance & normalize peak volume levels"
          supportsMultipleFiles={false}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Volume2 size={20} color="var(--accent-primary)" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>{file.name}</h3>
              </div>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {formatBytes(file.size)}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                if (normalizedUrl) URL.revokeObjectURL(normalizedUrl)
                setFile(null)
                setResult(null)
                setNormalizedUrl(null)
              }}
              disabled={isProcessing}
            >
              <RefreshCw size={14} /> Change Audio
            </button>
          </div>

          <div
            style={{
              padding: '1.25rem',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Target Peak Volume Level:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
              {(
                [
                  { db: -0.1, name: '-0.1 dBFS', desc: 'Maximum Loudness (Web/Streaming)' },
                  { db: -1.0, name: '-1.0 dBFS', desc: 'Standard Safe Peak (Recommended)' },
                  { db: -3.0, name: '-3.0 dBFS', desc: 'High Dynamic Headroom (Podcasts)' },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.db}
                  type="button"
                  onClick={() => setTargetPeakDb(preset.db)}
                  className={`btn ${targetPeakDb === preset.db ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0.65rem 0.85rem' }}
                  disabled={isProcessing}
                >
                  <strong style={{ fontSize: '0.95rem' }}>{preset.name}</strong>
                  <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>{preset.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {isProcessing && <ProgressBar progress={progress} statusText={status} />}
          {error && <div style={{ color: 'var(--accent-rose)', fontSize: '0.85rem' }}>{error}</div>}

          {!result && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleNormalize}
                disabled={isProcessing}
                style={{ padding: '0.75rem 1.5rem' }}
              >
                {isProcessing ? 'Normalizing Audio...' : `Normalize to ${targetPeakDb} dBFS`}
              </button>
            </div>
          )}

          {result && normalizedUrl && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                padding: '1.25rem',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--accent-emerald, #10b981)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <span style={{ fontWeight: 700, color: 'var(--accent-emerald, #10b981)' }}>
                    Normalization Applied!
                  </span>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Original Peak: <strong>{result.originalPeakDb.toFixed(1)} dBFS</strong> → Gain Adjustment:{' '}
                    <strong style={{ color: 'var(--accent-primary)' }}>
                      {result.gainAppliedDb >= 0 ? '+' : ''}
                      {result.gainAppliedDb.toFixed(1)} dB
                    </strong>
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() =>
                    triggerFileDownload(
                      result.blob,
                      `normalized_${file.name.replace(/\.[^/.]+$/, '')}.wav`
                    )
                  }
                >
                  <Download size={15} /> Download Normalized Audio (WAV)
                </button>
              </div>

              <audio src={normalizedUrl} controls style={{ width: '100%' }} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
