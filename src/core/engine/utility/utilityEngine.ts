import QRCode from 'qrcode'

/**
 * Generates a high-resolution QR code as a PNG Data URL.
 */
export async function generateQrDataUrl(
  text: string,
  options?: {
    width?: number
    margin?: number
    darkColor?: string
    lightColor?: string
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  }
): Promise<string> {
  return await QRCode.toDataURL(text, {
    width: options?.width || 400,
    margin: options?.margin !== undefined ? options.margin : 2,
    color: {
      dark: options?.darkColor || '#000000',
      light: options?.lightColor || '#ffffff',
    },
    errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
  })
}

/**
 * Generates an SVG string of a QR code.
 */
export async function generateQrSvg(
  text: string,
  options?: {
    margin?: number
    darkColor?: string
    lightColor?: string
  }
): Promise<string> {
  return await QRCode.toString(text, {
    type: 'svg',
    margin: options?.margin !== undefined ? options.margin : 2,
    color: {
      dark: options?.darkColor || '#000000',
      light: options?.lightColor || '#ffffff',
    },
  })
}

/**
 * Generates a cryptographically secure random password using Web Crypto CSPRNG.
 */
export function generateSecurePassword(
  length: number = 16,
  options = {
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  }
): { password: string; entropyBits: number } {
  let charset = ''
  if (options.uppercase) charset += 'ABCDEFGHJKLMNPQRSTUVWXYZ' // excludes confusing O, I
  if (options.lowercase) charset += 'abcdefghijkmnpqrstuvwxyz' // excludes confusing l, o
  if (options.numbers) charset += '23456789' // excludes confusing 0, 1
  if (options.symbols) charset += '!@#$%^&*()-_=+[]{}<>~'

  if (!charset) charset = 'abcdefghijklmnopqrstuvwxyz'

  const randomValues = new Uint32Array(length)
  crypto.getRandomValues(randomValues)

  let result = ''
  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length]
  }

  // Calculate Shannon entropy: length * log2(poolSize)
  const entropyBits = Math.round(length * Math.log2(charset.length))

  return { password: result, entropyBits }
}

/**
 * Generates bulk UUID v4 identifiers.
 */
export function generateUuids(count: number = 1): string[] {
  const result: string[] = []
  for (let i = 0; i < count; i++) {
    result.push(crypto.randomUUID())
  }
  return result
}

/**
 * Converts Hex color to RGB object.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const sanitized = hex.replace(/^#/, '')
  if (sanitized.length === 3) {
    return {
      r: parseInt(sanitized[0] + sanitized[0], 16),
      g: parseInt(sanitized[1] + sanitized[1], 16),
      b: parseInt(sanitized[2] + sanitized[2], 16),
    }
  }
  if (sanitized.length === 6) {
    return {
      r: parseInt(sanitized.substring(0, 2), 16),
      g: parseInt(sanitized.substring(2, 4), 16),
      b: parseInt(sanitized.substring(4, 6), 16),
    }
  }
  return null
}

/**
 * Converts RGB to HSL.
 */
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

/**
 * Computes WCAG 2.1 relative luminance for an RGB color.
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r / 255, g / 255, b / 255].map((val) =>
    val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
  )
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Computes WCAG 2.1 contrast ratio between two hex colors.
 */
export function calculateContrastRatio(
  foregroundHex: string,
  backgroundHex: string
): { ratio: number; aaNormal: boolean; aaLarge: boolean; aaaNormal: boolean } {
  const fg = hexToRgb(foregroundHex) || { r: 0, g: 0, b: 0 }
  const bg = hexToRgb(backgroundHex) || { r: 255, g: 255, b: 255 }

  const l1 = getRelativeLuminance(fg.r, fg.g, fg.b)
  const l2 = getRelativeLuminance(bg.r, bg.g, bg.b)

  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  const ratio = parseFloat(((lighter + 0.05) / (darker + 0.05)).toFixed(2))

  return {
    ratio,
    aaNormal: ratio >= 4.5,
    aaLarge: ratio >= 3.0,
    aaaNormal: ratio >= 7.0,
  }
}
