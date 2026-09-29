import type { FileValidationConfig, ValidationResult } from '../../types/processing'
import { isFileAccepted } from './fileUtils'

/**
 * Validates a list of selected files against tool configuration rules:
 * - Empty file detection (0 bytes)
 * - Oversized file detection (maxSizeMb)
 * - File type & extension matching
 * - Multi-file enforcement
 */
export function validateFiles(
  files: File[],
  config: FileValidationConfig = {}
): ValidationResult {
  const {
    acceptedTypes = [],
    maxSizeMb = 100,
    supportsMultipleFiles = false,
    minFiles = 1,
    maxFiles,
  } = config

  // Check if any files provided
  if (!files || files.length === 0) {
    return { valid: false, error: 'Please select a file to proceed.' }
  }

  // Check multiple files limit
  if (!supportsMultipleFiles && files.length > 1) {
    return {
      valid: false,
      error: 'This tool accepts only a single file at a time. Please select one file.',
    }
  }

  // Check minimum files requirement
  if (files.length < minFiles) {
    return {
      valid: false,
      error: `Please select at least ${minFiles} files to proceed.`,
    }
  }

  // Check maximum files requirement
  if (maxFiles && files.length > maxFiles) {
    return {
      valid: false,
      error: `You can upload a maximum of ${maxFiles} files at once.`,
    }
  }

  // Validate each file
  const maxBytes = maxSizeMb * 1024 * 1024

  for (const file of files) {
    // 1. Empty file detection
    if (file.size === 0) {
      return {
        valid: false,
        error: `"${file.name}" is empty (0 bytes). Please choose a valid non-empty file.`,
      }
    }

    // 2. Oversized file detection
    if (file.size > maxBytes) {
      return {
        valid: false,
        error: `"${file.name}" exceeds the safe browser limit of ${maxSizeMb} MB.`,
      }
    }

    // 3. Accepted types validation
    if (acceptedTypes.length > 0 && !isFileAccepted(file, acceptedTypes)) {
      const formattedTypes = acceptedTypes
        .map((t) => t.replace('application/', '').replace('image/', ''))
        .join(', ')
      return {
        valid: false,
        error: `"${file.name}" is not a supported file type. Accepted formats: ${formattedTypes}.`,
      }
    }
  }

  return { valid: true }
}

/**
 * Transforms any caught error into a friendly, human-actionable message.
 * Strips raw technical stack traces, file paths, and internal error codes.
 */
export function formatFriendlyError(error: unknown): string {
  if (!error) return 'An unexpected error occurred while processing.'

  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'Operation was cancelled.'
  }

  const rawMessage = error instanceof Error ? error.message : String(error)

  // Strip technical stack traces or line numbers
  const cleaned = rawMessage.split('\n')[0].trim()

  // 1. Out of memory / ArrayBuffer allocation failures
  if (
    cleaned.includes('Array buffer allocation failed') ||
    cleaned.includes('out of memory') ||
    cleaned.includes('allocation failed') ||
    error instanceof RangeError
  ) {
    return 'The file requires more memory than your browser can allocate. Please try with a smaller file or close unused browser tabs.'
  }

  // 2. Password protected / encrypted PDF
  if (
    cleaned.toLowerCase().includes('password') ||
    cleaned.toLowerCase().includes('encrypted')
  ) {
    return 'The file is password-protected or encrypted. Please remove the password and try again.'
  }

  // 3. Corrupted or invalid file format
  if (
    cleaned.toLowerCase().includes('corrupted') ||
    cleaned.toLowerCase().includes('invalid pdf') ||
    cleaned.toLowerCase().includes('end-of-file') ||
    cleaned.toLowerCase().includes('unexpected token') ||
    cleaned.toLowerCase().includes('bad signature')
  ) {
    return 'The file appears to be corrupted or in an unrecognized format. Please verify the original file and try again.'
  }

  // 4. Codec / media format unsupported
  if (
    cleaned.toLowerCase().includes('codec') ||
    cleaned.toLowerCase().includes('unsupported format') ||
    cleaned.toLowerCase().includes('decoding')
  ) {
    return 'Your browser does not support decoding this media format. Try converting it to standard MP4, WebM, or WAV first.'
  }

  // 5. Canvas dimension ceiling
  if (cleaned.toLowerCase().includes('canvas') && cleaned.toLowerCase().includes('size')) {
    return 'The image dimensions exceed your browser hardware limits. Please resize the image before processing.'
  }

  return cleaned || 'Failed to process file. Please try again with a different file.'
}
