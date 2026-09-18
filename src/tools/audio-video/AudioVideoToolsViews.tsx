import React, { useState } from 'react'
import { DropZone } from '../../components/common/DropZone'
import { ProgressBar } from '../../components/common/ProgressBar'
import { ActionButtons } from '../../components/common/ActionButtons'
import {
  trimAudio,
  convertAudioToWav,
  extractAudioFromVideo,
} from '../../core/engine/audio-video/audioVideoEngine'

// --- 1. AUDIO TRIMMER ---
export const AudioTrimmerView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [startSec, setStartSec] = useState(0)
  const [endSec, setEndSec] = useState(30)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleTrim = async () => {
    if (!file) return
    try {
      setError(null)
      setIsProcessing(true)
      const blob = await trimAudio(file, startSec, endSec, (p, s) => {
        setProgress(p)
        setStatus(s)
      })
      setDownloadUrl(URL.createObjectURL(blob))
    } catch (err: any) {
      setError(err.message || 'Failed to trim audio.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {!file ? (
        <DropZone accepts={['audio/*']} onFilesSelected={(f) => setFile(f[0])} title="Drop audio file to cut / trim" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><strong>{file.name}</strong></span>
            <button type="button" className="btn btn-secondary" onClick={() => setFile(null)}>Change Audio</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Start Time (seconds):
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                className="search-input"
                value={startSec}
                onChange={(e) => setStartSec(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                End Time (seconds):
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                className="search-input"
                value={endSec}
                onChange={(e) => setEndSec(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {isProcessing && <ProgressBar progress={progress} statusText={status} />}
          {error && <div style={{ color: 'var(--accent-rose)', fontSize: '0.85rem' }}>{error}</div>}

          <ActionButtons
            onProcess={handleTrim}
            isProcessing={isProcessing}
            processLabel={`Trim (${startSec}s - ${endSec}s)`}
            downloadUrl={downloadUrl}
            downloadFilename={`trimmed_${startSec}_${endSec}_${file.name.replace(/\.[^/.]+$/, '')}.wav`}
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

// --- 2. AUDIO CONVERTER ---
export const AudioConverterView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleConvert = async () => {
    if (!file) return
    try {
      setError(null)
      setIsProcessing(true)
      const blob = await convertAudioToWav(file)
      setDownloadUrl(URL.createObjectURL(blob))
    } catch (err: any) {
      setError(err.message || 'Failed to convert audio.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {!file ? (
        <DropZone accepts={['audio/*']} onFilesSelected={(f) => setFile(f[0])} title="Drop any audio file to convert to PCM WAV" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><strong>{file.name}</strong></span>
            <button type="button" className="btn btn-secondary" onClick={() => setFile(null)}>Change Audio</button>
          </div>

          {error && <div style={{ color: 'var(--accent-rose)', fontSize: '0.85rem' }}>{error}</div>}

          <ActionButtons
            onProcess={handleConvert}
            isProcessing={isProcessing}
            processLabel="Convert to WAV"
            downloadUrl={downloadUrl}
            downloadFilename={`${file.name.replace(/\.[^/.]+$/, '')}.wav`}
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

// --- 3. VIDEO AUDIO EXTRACTOR ---
export const VideoAudioExtractView: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleExtract = async () => {
    if (!file) return
    try {
      setError(null)
      setIsProcessing(true)
      const blob = await extractAudioFromVideo(file)
      setDownloadUrl(URL.createObjectURL(blob))
    } catch (err: any) {
      setError(err.message || 'Failed to extract audio track.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {!file ? (
        <DropZone accepts={['video/*', '.mp4', '.webm']} onFilesSelected={(f) => setFile(f[0])} title="Drop video file (MP4/WebM) to extract sound track" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><strong>{file.name}</strong></span>
            <button type="button" className="btn btn-secondary" onClick={() => setFile(null)}>Change Video</button>
          </div>

          {error && <div style={{ color: 'var(--accent-rose)', fontSize: '0.85rem' }}>{error}</div>}

          <ActionButtons
            onProcess={handleExtract}
            isProcessing={isProcessing}
            processLabel="Extract Audio Track (WAV)"
            downloadUrl={downloadUrl}
            downloadFilename={`extracted_audio_${file.name.replace(/\.[^/.]+$/, '')}.wav`}
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
