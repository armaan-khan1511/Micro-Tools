# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-09-18

### Added
- Initial release of MicroTools platform with 40 client-side web utilities.
- **Core Processing Engines**:
  - `pdfEngine`: In-browser PDF merge, split, images-to-pdf, rotate, inspect, and organize via `pdf-lib`.
  - `imageEngine`: Canvas-based compressor, format converter, resizer, cropper, palette extractor, EXIF stripper, watermark, and filters.
  - `archiveEngine`: Multi-file ZIP packaging, ZIP browsing/extraction via `jszip`, Web Crypto SHA-256/512 hashing, and Base64 conversions.
  - `audioVideoEngine`: Web Audio API audio trimmer, format converter to 16-bit PCM WAV, tempo adjuster, and video audio track extractor.
  - `documentEngine`: Live Markdown editor with sanitized HTML preview (`marked` + `DOMPurify`), text diff checker (`diff`), word/reading time counter, JSON formatter/minifier, and text case converter.
  - `utilityEngine`: QR Code generator with PNG/SVG export (`qrcode`), CSPRNG secure password generator, bulk UUID v4 generator, and WCAG 2.1 contrast ratio checker.
- **UI/UX & Design System**:
  - Responsive, minimalist interface with dark/light mode toggle.
  - `Ctrl + K` instant fuzzy search and category filtering tabs.
  - Modular drag-and-drop file upload zone with file size safeguards.
  - Progress bar and download/reset action bar.
- **Infrastructure & Deployment**:
  - `vite.config.ts` manual chunking to isolate heavy processing libraries from initial bundle.
  - `vercel.json` SPA routing rewrite rules and strict HTTP security headers.
  - Strict TypeScript compliance (`verbatimModuleSyntax: true`).
