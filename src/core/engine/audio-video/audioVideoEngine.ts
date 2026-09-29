import { getFFmpeg, cleanupVirtualFiles } from './ffmpegManager'

/**
 * Encodes an AudioBuffer into a standard 16-bit PCM WAV Blob.
 */
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const format = 1 // PCM
  const bitDepth = 16

  const samples = buffer.length
  const blockAlign = (numChannels * bitDepth) / 8
  const byteRate = sampleRate * blockAlign
  const dataSize = samples * blockAlign
  const bufferLength = 44 + dataSize

  const arrayBuffer = new ArrayBuffer(bufferLength)
  const view = new DataView(arrayBuffer)

  // RIFF identifier
  writeString(view, 0, 'RIFF')
  // RIFF chunk length
  view.setUint32(4, 36 + dataSize, true)
  // RIFF type
  writeString(view, 8, 'WAVE')
  // format chunk identifier
  writeString(view, 12, 'fmt ')
  // format chunk length
  view.setUint32(16, 16, true)
  // sample format (raw)
  view.setUint16(20, format, true)
  // channel count
  view.setUint16(22, numChannels, true)
  // sample rate
  view.setUint32(24, sampleRate, true)
  // byte rate (sample rate * block align)
  view.setUint32(28, byteRate, true)
  // block align (channel count * bytes per sample)
  view.setUint16(32, blockAlign, true)
  // bits per sample
  view.setUint16(34, bitDepth, true)
  // data chunk identifier
  writeString(view, 36, 'data')
  // data chunk length
  view.setUint32(40, dataSize, true)

  // Write PCM audio samples
  let offset = 44
  for (let i = 0; i < samples; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]))
      // Convert float [-1.0, 1.0] to 16-bit signed integer [-32768, 32767]
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff
      view.setInt16(offset, intSample, true)
      offset += 2
    }
  }

  return new Blob([view], { type: 'audio/wav' })
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}

/**
 * 1. Trims audio between startTime and endTime in seconds using Web Audio API.
 */
export async function trimAudio(
  file: File,
  startTime: number,
  endTime: number,
  onProgress?: (progress: number, status: string) => void
): Promise<{ blob: Blob; duration: number }> {
  onProgress?.(15, 'Reading audio file into buffer...')
  const arrayBuffer = await file.arrayBuffer()
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()

  onProgress?.(35, 'Decoding audio samples...')
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
  await audioCtx.close()

  const sampleRate = audioBuffer.sampleRate
  const totalDuration = audioBuffer.duration

  const start = Math.max(0, Math.min(startTime, totalDuration))
  const end = Math.max(start, Math.min(endTime, totalDuration))
  const lengthInSamples = Math.floor((end - start) * sampleRate)

  if (lengthInSamples <= 0) {
    throw new Error('Trim range must be greater than 0 seconds.')
  }

  onProgress?.(65, 'Slicing audio samples...')
  const trimmedAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const trimmedBuffer = trimmedAudioContext.createBuffer(
    audioBuffer.numberOfChannels,
    lengthInSamples,
    sampleRate
  )

  const startOffset = Math.floor(start * sampleRate)
  for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
    const channelData = audioBuffer.getChannelData(c)
    const trimmedChannelData = trimmedBuffer.getChannelData(c)
    trimmedChannelData.set(channelData.subarray(startOffset, startOffset + lengthInSamples))
  }
  await trimmedAudioContext.close()

  onProgress?.(85, 'Encoding output to 16-bit PCM WAV...')
  const wavBlob = audioBufferToWavBlob(trimmedBuffer)
  onProgress?.(100, 'Audio trimmed successfully!')
  return { blob: wavBlob, duration: end - start }
}

/**
 * 2. Normalizes audio volume (Peak normalization) using native Web Audio API.
 * Scans all channels for peak sample amplitude and scales linear gain to target dBFS.
 */
export async function normalizeAudioVolume(
  file: File,
  targetPeakDb = -1.0,
  onProgress?: (progress: number, status: string) => void
): Promise<{
  blob: Blob
  originalPeakDb: number
  targetPeakDb: number
  gainAppliedDb: number
  duration: number
}> {
  onProgress?.(15, 'Reading audio data...')
  const arrayBuffer = await file.arrayBuffer()
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()

  onProgress?.(35, 'Decoding audio stream...')
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
  await audioCtx.close()

  onProgress?.(55, 'Analyzing peak sample levels across all channels...')
  const numChannels = audioBuffer.numberOfChannels
  const totalSamples = audioBuffer.length
  let maxAmplitude = 0

  for (let c = 0; c < numChannels; c++) {
    const data = audioBuffer.getChannelData(c)
    for (let i = 0; i < totalSamples; i++) {
      const abs = Math.abs(data[i])
      if (abs > maxAmplitude) {
        maxAmplitude = abs
      }
    }
  }

  if (maxAmplitude === 0) {
    // Audio is completely silent
    const silentBlob = audioBufferToWavBlob(audioBuffer)
    return {
      blob: silentBlob,
      originalPeakDb: -100,
      targetPeakDb,
      gainAppliedDb: 0,
      duration: audioBuffer.duration,
    }
  }

  const originalPeakDb = 20 * Math.log10(maxAmplitude)
  const targetLinearPeak = Math.pow(10, targetPeakDb / 20)
  const gainMultiplier = targetLinearPeak / maxAmplitude
  const gainAppliedDb = 20 * Math.log10(gainMultiplier)

  onProgress?.(75, `Applying ${gainAppliedDb >= 0 ? '+' : ''}${gainAppliedDb.toFixed(1)} dB gain normalization...`)
  const normalizedCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  const normalizedBuffer = normalizedCtx.createBuffer(numChannels, totalSamples, audioBuffer.sampleRate)

  for (let c = 0; c < numChannels; c++) {
    const sourceData = audioBuffer.getChannelData(c)
    const targetData = normalizedBuffer.getChannelData(c)
    for (let i = 0; i < totalSamples; i++) {
      targetData[i] = Math.max(-1.0, Math.min(1.0, sourceData[i] * gainMultiplier))
    }
  }
  await normalizedCtx.close()

  onProgress?.(90, 'Encoding normalized audio to pristine PCM WAV...')
  const wavBlob = audioBufferToWavBlob(normalizedBuffer)
  onProgress?.(100, 'Audio volume normalized successfully!')

  return {
    blob: wavBlob,
    originalPeakDb,
    targetPeakDb,
    gainAppliedDb,
    duration: audioBuffer.duration,
  }
}

/**
 * 3. Video Compressor using lazy-loaded single-threaded FFmpeg WASM.
 */
export async function compressVideo(
  file: File,
  options: {
    format: 'mp4' | 'webm'
    resolution: 'original' | '1080p' | '720p' | '480p' | '360p'
    quality: 'high' | 'medium' | 'low'
    keepAudio: boolean
  },
  onProgress?: (progress: number, status: string) => void
): Promise<Blob> {
  const ffmpeg = await getFFmpeg(onProgress)
  const { fetchFile } = await import('@ffmpeg/util')

  onProgress?.(25, 'Loading input video into virtual filesystem...')
  const inExt = file.name.split('.').pop() || 'mp4'
  const inName = `input_${Date.now()}.${inExt}`
  const outName = `output_${Date.now()}.${options.format}`

  await ffmpeg.writeFile(inName, await fetchFile(file))

  // Determine scale filter
  let scaleFilter = ''
  if (options.resolution === '1080p') scaleFilter = "scale='min(1920,iw)':-2"
  else if (options.resolution === '720p') scaleFilter = "scale='min(1280,iw)':-2"
  else if (options.resolution === '480p') scaleFilter = "scale='min(854,iw)':-2"
  else if (options.resolution === '360p') scaleFilter = "scale='min(640,iw)':-2"

  // CRF mapping
  const crfMap = { high: '24', medium: '28', low: '34' }
  const crf = crfMap[options.quality]

  const args: string[] = ['-i', inName]

  if (scaleFilter) {
    args.push('-vf', scaleFilter)
  }

  if (options.format === 'mp4') {
    args.push('-c:v', 'libx264', '-crf', crf, '-preset', 'ultrafast')
    if (options.keepAudio) {
      args.push('-c:a', 'aac', '-b:a', '128k')
    } else {
      args.push('-an')
    }
  } else {
    // webm
    args.push('-c:v', 'libvpx-vp9', '-crf', crf, '-b:v', '0')
    if (options.keepAudio) {
      args.push('-c:a', 'libopus', '-b:a', '96k')
    } else {
      args.push('-an')
    }
  }

  args.push(outName)

  onProgress?.(45, 'Encoding compressed video stream...')
  try {
    ffmpeg.on('progress', (p) => {
      if (p.progress >= 0 && p.progress <= 1) {
        const pct = 45 + Math.round(p.progress * 45)
        onProgress?.(pct, `Transcoding video: ${Math.round(p.progress * 100)}%`)
      }
    })

    await ffmpeg.exec(args)
    onProgress?.(92, 'Reading compressed video output...')
    const data = (await ffmpeg.readFile(outName)) as Uint8Array
    const mimeType = options.format === 'mp4' ? 'video/mp4' : 'video/webm'
    const blob = new Blob([data.buffer as any], { type: mimeType })
    return blob
  } finally {
    await cleanupVirtualFiles(ffmpeg, [inName, outName])
  }
}

/**
 * 4. Video Converter using lazy-loaded FFmpeg WASM.
 */
export async function convertVideo(
  file: File,
  targetFormat: 'mp4' | 'webm' | 'mov' | 'mkv',
  onProgress?: (progress: number, status: string) => void
): Promise<Blob> {
  const ffmpeg = await getFFmpeg(onProgress)
  const { fetchFile } = await import('@ffmpeg/util')

  const inExt = file.name.split('.').pop() || 'mp4'
  const inName = `input_${Date.now()}.${inExt}`
  const outName = `output_${Date.now()}.${targetFormat}`

  onProgress?.(25, 'Loading video into memory...')
  await ffmpeg.writeFile(inName, await fetchFile(file))

  onProgress?.(45, `Transcoding to ${targetFormat.toUpperCase()} container...`)
  const args = ['-i', inName]

  if (targetFormat === 'mp4') {
    args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', outName)
  } else if (targetFormat === 'webm') {
    args.push('-c:v', 'libvpx-vp9', '-c:a', 'libopus', outName)
  } else {
    args.push(outName)
  }

  try {
    ffmpeg.on('progress', (p) => {
      if (p.progress >= 0 && p.progress <= 1) {
        const pct = 45 + Math.round(p.progress * 45)
        onProgress?.(pct, `Converting video: ${Math.round(p.progress * 100)}%`)
      }
    })

    await ffmpeg.exec(args)
    onProgress?.(92, 'Extracting converted file...')
    const data = (await ffmpeg.readFile(outName)) as Uint8Array
    const mimeTypes: Record<string, string> = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime',
      mkv: 'video/x-matroska',
    }
    return new Blob([data.buffer as any], { type: mimeTypes[targetFormat] || 'video/mp4' })
  } finally {
    await cleanupVirtualFiles(ffmpeg, [inName, outName])
  }
}

/**
 * 5. Video to Animated GIF with 2-pass palette generation for crisp visual quality.
 */
export async function videoToGif(
  file: File,
  options: {
    startTime: number
    endTime: number
    width: number
    fps: number
  },
  onProgress?: (progress: number, status: string) => void
): Promise<Blob> {
  const ffmpeg = await getFFmpeg(onProgress)
  const { fetchFile } = await import('@ffmpeg/util')

  const inExt = file.name.split('.').pop() || 'mp4'
  const inName = `input_${Date.now()}.${inExt}`
  const outName = `output_${Date.now()}.gif`

  onProgress?.(25, 'Loading video segment...')
  await ffmpeg.writeFile(inName, await fetchFile(file))

  const duration = Math.max(0.5, options.endTime - options.startTime)
  const filter = `fps=${options.fps},scale=${options.width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`

  const args = [
    '-ss',
    String(options.startTime),
    '-t',
    String(duration),
    '-i',
    inName,
    '-vf',
    filter,
    outName,
  ]

  onProgress?.(50, 'Rendering animated GIF frames with color palette optimization...')
  try {
    await ffmpeg.exec(args)
    onProgress?.(92, 'Generating GIF file...')
    const data = (await ffmpeg.readFile(outName)) as Uint8Array
    return new Blob([data.buffer as any], { type: 'image/gif' })
  } finally {
    await cleanupVirtualFiles(ffmpeg, [inName, outName])
  }
}

/**
 * 6. Extracts audio from video to either lossless WAV (via Web Audio) or MP3 (via FFmpeg).
 */
export async function extractAudioFromVideo(
  videoFile: File,
  format: 'wav' | 'mp3' = 'wav',
  onProgress?: (progress: number, status: string) => void
): Promise<Blob> {
  if (format === 'wav') {
    // Instant Web Audio API extraction: 0 WASM overhead
    onProgress?.(15, 'Reading video container...')
    const arrayBuffer = await videoFile.arrayBuffer()
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()

    onProgress?.(45, 'Extracting and decoding audio stream...')
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer).catch(() => {
      throw new Error(
        'The video file audio track could not be decoded by the native browser audio engine. Try extracting via MP3 (FFmpeg).'
      )
    })
    await audioCtx.close()

    onProgress?.(80, 'Encoding extracted track to 16-bit PCM WAV...')
    const wavBlob = audioBufferToWavBlob(audioBuffer)
    onProgress?.(100, 'Audio extracted successfully!')
    return wavBlob
  }

  // MP3 extraction via FFmpeg
  const ffmpeg = await getFFmpeg(onProgress)
  const { fetchFile } = await import('@ffmpeg/util')

  const inExt = videoFile.name.split('.').pop() || 'mp4'
  const inName = `input_${Date.now()}.${inExt}`
  const outName = `output_${Date.now()}.mp3`

  onProgress?.(25, 'Loading video file...')
  await ffmpeg.writeFile(inName, await fetchFile(videoFile))

  onProgress?.(50, 'Extracting audio stream to MP3...')
  const args = ['-i', inName, '-vn', '-c:a', 'libmp3lame', '-q:a', '2', outName]

  try {
    await ffmpeg.exec(args)
    onProgress?.(90, 'Reading MP3 output...')
    const data = (await ffmpeg.readFile(outName)) as Uint8Array
    return new Blob([data.buffer as any], { type: 'audio/mpeg' })
  } finally {
    await cleanupVirtualFiles(ffmpeg, [inName, outName])
  }
}

/**
 * 7. Audio format converter supporting WAV, MP3, AAC, and OGG.
 */
export async function convertAudio(
  file: File,
  targetFormat: 'wav' | 'mp3' | 'aac' | 'ogg',
  onProgress?: (progress: number, status: string) => void
): Promise<Blob> {
  if (targetFormat === 'wav') {
    // Instant Web Audio API conversion
    onProgress?.(20, 'Reading audio file...')
    const arrayBuffer = await file.arrayBuffer()
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()

    onProgress?.(50, 'Decoding audio track...')
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
    await audioCtx.close()

    onProgress?.(85, 'Encoding to WAV container...')
    return audioBufferToWavBlob(audioBuffer)
  }

  // Transcoding via FFmpeg WASM
  const ffmpeg = await getFFmpeg(onProgress)
  const { fetchFile } = await import('@ffmpeg/util')

  const inExt = file.name.split('.').pop() || 'wav'
  const inName = `input_${Date.now()}.${inExt}`
  const outName = `output_${Date.now()}.${targetFormat}`

  onProgress?.(25, 'Loading audio track into memory...')
  await ffmpeg.writeFile(inName, await fetchFile(file))

  onProgress?.(50, `Transcoding audio to ${targetFormat.toUpperCase()}...`)
  const args = ['-i', inName]

  if (targetFormat === 'mp3') {
    args.push('-c:a', 'libmp3lame', '-q:a', '2', outName)
  } else if (targetFormat === 'aac') {
    args.push('-c:a', 'aac', '-b:a', '192k', outName)
  } else if (targetFormat === 'ogg') {
    args.push('-c:a', 'libvorbis', '-q:a', '4', outName)
  }

  try {
    await ffmpeg.exec(args)
    onProgress?.(92, 'Reading converted audio...')
    const data = (await ffmpeg.readFile(outName)) as Uint8Array
    const mimeMap: Record<string, string> = {
      mp3: 'audio/mpeg',
      aac: 'audio/aac',
      ogg: 'audio/ogg',
    }
    return new Blob([data.buffer as any], { type: mimeMap[targetFormat] || 'audio/mpeg' })
  } finally {
    await cleanupVirtualFiles(ffmpeg, [inName, outName])
  }
}

/**
 * Changes playback tempo/speed using OfflineAudioContext.
 */
export async function adjustAudioSpeed(
  file: File,
  speedMultiplier: number,
  onProgress?: (progress: number, status: string) => void
): Promise<Blob> {
  onProgress?.(20, 'Decoding audio stream...')
  const arrayBuffer = await file.arrayBuffer()
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  const sourceBuffer = await audioCtx.decodeAudioData(arrayBuffer)
  await audioCtx.close()

  onProgress?.(45, `Rendering offline at ${speedMultiplier}x speed...`)
  const newLength = Math.floor(sourceBuffer.length / speedMultiplier)
  const offlineCtx = new OfflineAudioContext(
    sourceBuffer.numberOfChannels,
    newLength,
    sourceBuffer.sampleRate
  )

  const source = offlineCtx.createBufferSource()
  source.buffer = sourceBuffer
  source.playbackRate.value = speedMultiplier
  source.connect(offlineCtx.destination)
  source.start(0)

  const renderedBuffer = await offlineCtx.startRendering()

  onProgress?.(85, 'Exporting WAV...')
  const wavBlob = audioBufferToWavBlob(renderedBuffer)
  onProgress?.(100, 'Done!')
  return wavBlob
}
