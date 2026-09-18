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
 * Trims audio between startTime and endTime in seconds.
 */
export async function trimAudio(
  file: File,
  startTime: number,
  endTime: number,
  onProgress?: (progress: number, status: string) => void
): Promise<Blob> {
  onProgress?.(15, 'Reading audio file...')
  const arrayBuffer = await file.arrayBuffer()
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()

  onProgress?.(35, 'Decoding audio samples...')
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
  await audioCtx.close()

  const sampleRate = audioBuffer.sampleRate
  const duration = audioBuffer.duration

  const start = Math.max(0, Math.min(startTime, duration))
  const end = Math.max(start, Math.min(endTime, duration))
  const lengthInSamples = Math.floor((end - start) * sampleRate)

  if (lengthInSamples <= 0) {
    throw new Error('Trim range must be greater than 0 seconds.')
  }

  onProgress?.(65, 'Slicing audio buffer...')
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
  return wavBlob
}

/**
 * Converts any browser-decodable audio format to lossless standard PCM WAV.
 */
export async function convertAudioToWav(
  file: File,
  onProgress?: (progress: number, status: string) => void
): Promise<Blob> {
  onProgress?.(20, 'Reading audio track...')
  const arrayBuffer = await file.arrayBuffer()
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()

  onProgress?.(50, 'Decoding audio track...')
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
  await audioCtx.close()

  onProgress?.(80, 'Encoding to WAV container...')
  const wavBlob = audioBufferToWavBlob(audioBuffer)
  onProgress?.(100, 'Audio converted successfully!')
  return wavBlob
}

/**
 * Changes playback tempo/speed using OfflineAudioContext.
 */
export async function adjustAudioSpeed(
  file: File,
  speedMultiplier: number, // 0.5 to 2.0
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

/**
 * Extracts audio from a video file by decoding the video's audio track via AudioContext.
 */
export async function extractAudioFromVideo(
  videoFile: File,
  onProgress?: (progress: number, status: string) => void
): Promise<Blob> {
  onProgress?.(15, 'Reading video container...')
  const arrayBuffer = await videoFile.arrayBuffer()
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()

  onProgress?.(40, 'Extracting and decoding audio stream...')
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer).catch(() => {
    throw new Error('This video format does not contain a standard browser-decodable audio track.')
  })
  await audioCtx.close()

  onProgress?.(80, 'Encoding extracted track to WAV...')
  const wavBlob = audioBufferToWavBlob(audioBuffer)
  onProgress?.(100, 'Audio extracted successfully!')
  return wavBlob
}
