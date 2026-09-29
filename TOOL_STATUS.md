# MicroTools — Client-Side Tool Status & Security Audit

This document maintains the implementation status, client-side architectural design, security protections, and testing verification results for all MicroTools modules.

Last Updated: September 2026  
Status: **Production Ready (100% In-Browser Execution)**

---

## Tool Status Matrix

| # | Tool Name | Tool ID | Route | Status | Processing Engine | Client-Side Security & Protections |
|---|---|---|---|---|---|---|
| 1 | **Create ZIP** | `zip-creator` | `/tool/zip-creator` | ✅ Ready | `JSZip` (DEFLATE / Store) | Multi-file handling, preserve directory paths, client RAM safeguards, configurable compression (levels 0–9). |
| 2 | **Extract ZIP** | `zip-extractor` | `/tool/zip-extractor` | ✅ Ready | `JSZip` + Blob API | **Zip Slip Protection**: Sanitizes traversal sequences (`../`, `..\`, leading slashes). **Dangerous file warnings** for executable scripts (`.exe`, `.bat`, `.sh`, `.vbs`, etc.). Safe Blob downloads, zero code execution. |
| 3 | **File Hash Generator** | `file-hash` | `/tool/file-hash` | ✅ Ready | Web Crypto API (`SubtleCrypto`) | Hardware-accelerated native hashing. Supports SHA-256, SHA-512, and SHA-1 (clearly badged as legacy/insecure). Text & file inputs, checksum comparator, Web Worker fallback for large files. |
| 4 | **JSON Formatter** | `json-formatter` | `/tool/json-formatter` | ✅ Ready | Native JSON Parser | RFC 8259 compliance, customizable indent (2/4 spaces, Tab), recursive key sorting, precise syntax error diagnostics (line, column, visual code excerpt pointer). |
| 5 | **JSON Minifier** | `json-minifier` | `/tool/json-minifier` | ✅ Ready | Native JSON Parser | Strict validation prior to compression, eliminates all excess whitespace/tabs while preserving strings. Live metrics: original bytes, minified bytes, bytes saved, % compression ratio. |
| 6 | **Base64 Encoder** | `base64-encoder` | `/tool/base64-encoder` | ✅ Ready | `TextEncoder` + `FileReader` | Dedicated Text vs File modes. Multi-byte UTF-8 Unicode/emoji safety. Data URI prefix option. Large file memory warning (>15MB). |
| 7 | **Base64 Decoder** | `base64-decoder` | `/tool/base64-decoder` | ✅ Ready | `TextDecoder` + Blob API | Dedicated Text vs File modes. Full Unicode multi-byte support. Automatic Data URI MIME type and extension detection. Strict Base64 alphabet validation with friendly error messages. |
| 8 | **Text File Converter** | `text-converter` | `/tool/text-converter` | ✅ Ready | Native Text Transforms | Line endings (`CRLF` <-> `LF` <-> `CR`), Indentation (Tabs <-> 2/4 spaces), Data Representations (Hex dump, Hex to text, Binary bits, Binary to text, HTML entities encode/decode), Live line/word/byte metrics. |
| 9 | **File Metadata Viewer** | `file-metadata` | `/tool/file-metadata` | ✅ Ready | Web Crypto + HTML5 APIs | File signatures & Magic Bytes analysis (first 32 bytes Hex/ASCII), File extension vs signature integrity mismatch alert, SHA-256 integrity checksum, format-specific deep inspection (dimensions, duration, page count, line counts). Exportable JSON and text reports. |

---

## Detailed Tool Specifications & Security Controls

### 1. Create ZIP (`/tool/zip-creator`)
* **File Upload**: Drag-and-drop or file picker with multi-file support.
* **File Management**: Real-time selected file list showing size, name, remove individual file (`X`), and clear-all action.
* **Integrity**: Preserves exact filenames and relative folder paths if folders are dropped.
* **Compression**: Options for Standard (Level 6), Maximum (Level 9), Fast (Level 1), and Store (Level 0).
* **Progress**: Real-time progress bar reporting compression percentage.
* **Output**: Generates standard DEFLATE `.zip` archive downloaded via managed Blob URL.

### 2. Extract ZIP (`/tool/zip-extractor`)
* **Inspection**: Inspects contained entries without executing or unpacking malicious files into the filesystem.
* **Zip Slip Mitigation**:
  * Strips leading slashes, Windows drive letters (e.g. `C:/`), and null bytes (`\0`).
  * Normalizes path segments and eliminates `../` relative traversals above root.
  * Sanitizes Windows reserved device names (`CON`, `PRN`, `AUX`, `NUL`, `COM1-9`, `LPT1-9`).
  * Displays a `[Path Sanitized]` security badge when traversal attempts are intercepted.
* **Dangerous File Warnings**:
  * Automatically scans for executable/script extensions (`.exe`, `.bat`, `.cmd`, `.sh`, `.vbs`, `.js`, `.scr`, `.msi`, `.dll`, `.com`, `.ps1`, `.jar`, `.hta`, `.reg`).
  * Displays high-visibility warning banner and requires confirmation before downloading.
* **Safe Extraction**:
  * Files are extracted into memory as isolated Blobs and downloaded with sanitized names.
  * Allows extracting individual selected files or all files in batch.

### 3. File Hash Generator (`/tool/file-hash`)
* **Hardware Acceleration**: Uses `window.crypto.subtle.digest` for maximum throughput.
* **Algorithm Support**:
  * **SHA-256**: High-speed, secure, collision-resistant standard.
  * **SHA-512**: Maximum security cryptographic checksum.
  * **SHA-1**: Prominently marked with `⚠️ Legacy (Collision Vulnerable)` warning badge per NIST standards.
* **Input Types**:
  * **Plain Text**: Live or on-demand text hashing with instant digest calculation.
  * **Uploaded Files**: Direct ArrayBuffer or Web Worker off-thread hashing.
* **Utility Features**:
  * UPPERCASE / lowercase hex toggle.
  * Checksum comparator: paste an expected hash to verify file integrity with green/red match indicators.
  * Copy button with 2-second visual confirmation.

### 4. JSON Formatter & Validator (`/tool/json-formatter`)
* **Formatting Options**: 2 spaces, 4 spaces, or Tab indentation.
* **Key Sorting**: Optional recursive alphabetical key sorting.
* **Diagnostic Syntax Errors**:
  * Extracts exact error line and column numbers.
  * Generates visual code excerpt with column pointer (`^`) highlighting the exact failure location.
* **Inputs/Outputs**: Upload `.json`/`.txt` or paste directly; 1-click copy and `.json` file download.

### 5. JSON Minifier (`/tool/json-minifier`)
* **Minification Engine**: Eliminates all redundant whitespace, tabs, and line breaks while preserving string literals, escape codes, and Unicode characters.
* **Strict Validation**: Validates JSON syntax prior to minification, displaying detailed diagnostic error pointers if invalid.
* **Efficiency Metrics**: Displays original byte size, minified byte size, bytes saved, and compression percentage.

### 6. Base64 Encoder (`/tool/base64-encoder`)
* **Text Mode**: Multi-byte UTF-8 encoding using `TextEncoder` (prevents latin-1 truncation and supports emojis and all Unicode scripts).
* **File Mode**: Converts any binary file to Base64 using `FileReader.readAsDataURL`.
* **Data URI Option**: Toggle between raw Base64 and complete Data URI string (`data:mime;base64,...`).
* **Memory Safety**: Displays explicit warning if file exceeds 15MB, explaining in-browser heap constraints.

### 7. Base64 Decoder (`/tool/base64-decoder`)
* **Text Mode**: Decodes Base64 payloads back to UTF-8 text using `TextDecoder` with strict validation against illegal characters.
* **File Mode**: Decodes raw Base64 or Data URI strings back to downloadable binary files (`Blob`), automatically extracting MIME types and suggested extensions.
* **Image Preview**: Live thumbnail preview for decoded image payloads.

### 8. Text File Converter (`/tool/text-converter`)
* **Line Endings**: Converts between Windows CRLF (`\r\n`), Unix LF (`\n`), and Classic Mac CR (`\r`).
* **Indentation**: Converts Tabs to 2/4/8 spaces and Spaces to Tabs.
* **Representations**:
  * Text to Hexadecimal dump and Hex dump to Text.
  * Text to Binary bitstream (0s and 1s) and Binary bitstream to Text.
  * HTML entities encoding (`&`, `<`, `>`, `"`, `'`) and decoding.
* **Text Casing**: UPPERCASE, lowercase, Title Case.
* **Live Statistics**: Displays before vs after line count, character count, and byte size.

### 9. File Metadata Viewer (`/tool/file-metadata`)
* **Universal Properties**: File name, extension, exact bytes, human-readable size, MIME type, last modified date.
* **Magic Bytes Inspector**: Displays first 32 bytes in Hexadecimal and ASCII format.
* **Signature Verification**: Identifies format by magic bytes (PNG, JPEG, GIF, PDF, ZIP, WebM, MP4, MP3, WAV, WebP, BMP, XML/HTML, JSON) and verifies if the declared extension matches the internal file signature (protecting against renamed/disguised files).
* **Integrity Hash**: Computes SHA-256 hash client-side.
* **Deep Format Metrics**:
  * Image: Natural dimensions (width × height) and aspect ratio.
  * Audio/Video: Media duration and video resolution.
  * Text: Line count, word count, character count, detected line endings (CRLF vs LF).
  * ZIP: Total entries count, total uncompressed size, estimated compression ratio.
* **Export**: Export inspection report as formatted `.txt` report or formatted `.json`.

---

## Document & Spreadsheet Tools Matrix

| # | Tool Name | Tool ID | Route | Conversion Fidelity Label | Processing Engine | Browser Capabilities & Safeguards |
|---|---|---|---|---|---|---|
| 1 | **Text to PDF** | `text-to-pdf` | `/tool/text-to-pdf` | `[Basic Conversion]` | `pdf-lib` | Multi-page text flow, customizable margins (normal, compact, wide), font sizes (10–14pt), orientation (Portrait/Landscape), page numbering, and TXT download. |
| 2 | **Markdown to HTML** | `markdown-to-html` | `/tool/markdown-to-html` | `[Layout-Preserving Conversion]` | `marked` + `DOMPurify` | Real-time split editor, live visual preview, syntax-highlighted raw HTML, 100% XSS sanitization via DOMPurify, copy HTML and download `.html` / `.md`. |
| 3 | **Markdown to PDF** | `markdown-to-pdf` | `/tool/markdown-to-pdf` | `[Layout-Preserving Conversion]` | `marked` + `pdf-lib` | Styled vector PDF output supporting H1–H4 headers, unordered/ordered lists, blockquotes, code blocks, page format selector (A4, US Letter), and live preview. |
| 4 | **CSV to Excel** | `csv-to-excel` | `/tool/csv-to-excel` | `[Basic Conversion]` | `xlsx` (SheetJS Community) | Delimiter handling (Auto-detect, Comma `,`, Semicolon `;`, Tab `\t`, Pipe `\|`), custom sheet naming, interactive table preview grid, and valid `.xlsx` export. |
| 5 | **Excel to CSV** | `excel-to-csv` | `/tool/excel-to-csv` | `[Basic Conversion]` | `xlsx` (SheetJS Community) | Multi-sheet inspection, interactive worksheet selector dropdown, row/column counts, custom output delimiter, live data preview, and `.csv` export. |
| 6 | **PDF to Word** | `pdf-to-word` | `/tool/pdf-to-word` | `[Text Extraction to Document]` | `pdfjs-dist` + `JSZip` (OpenXML) | Genuine browser extraction of digital text streams packaged into valid ECMA-376 Microsoft Word (`.docx`) OpenXML files. Reflowable paragraphs; no server upload. |
| 7 | **Word to PDF** | `word-to-pdf` | `/tool/word-to-pdf` | `[Approximate Conversion]` | `JSZip` (OpenXML) + `pdf-lib` | Unpacks `.docx` OpenXML structure in-memory, parses headings, paragraphs, and bold styles, and renders a clean vector PDF. |
| 8 | **PDF to Excel** | `pdf-to-excel` | `/tool/pdf-to-excel` | `[Approximate / Tabular Text Extraction]` | `pdfjs-dist` + `xlsx` | 2D coordinate-based clustering of text glyphs into table rows and numerical columns; exports valid `.xlsx` workbook. Clear disclosure that scanned PDFs require OCR. |
| 9 | **PDF to Text** | `pdf-to-text` / `pdf-extract-text` | `/tool/pdf-extract-text` | `[Text Extraction]` | `pdfjs-dist` | Extracts digital selectable text glyphs across all pages, provides word/char counts, copy to clipboard, `.txt` download, and scans-detection warning. |

---

### Conversion Fidelity Rules & Standards

To maintain total transparency and user trust, MicroTools strictly enforces honest conversion labeling:
* **`[Text Extraction]`**: Extracts raw digital text content from document streams without visual layout or styling.
* **`[Basic Conversion]`**: Maps tabular data or plain text to standard container formats (e.g. CSV to Excel, Text to PDF) with clean default layout.
* **`[Layout-Preserving Conversion]`**: Reliably preserves semantic styles, headings, lists, and formatting (e.g. Markdown to HTML, Markdown to vector PDF).
* **`[Approximate Conversion]`**: Extracts semantic structure, paragraphs, and typography into target formats, but acknowledges that complex multi-column 2D vector graphic placement cannot be reflowed identically without server-side deep learning layout engines.

---

---

## Video & Audio Tools Matrix

| # | Tool Name | Tool ID | Route | Processing Engine | Capabilities & Safeguards |
|---|---|---|---|---|---|
| 1 | **Video Compressor** | `video-compress` | `/tool/video-compress` | FFmpeg WASM (Single-Threaded) | Resolution scaling (1080p, 720p, 480p, 360p), CRF quality control (Balanced, High, Smallest), MP4 (H.264) / WebM (VP9) export, audio retention toggle. >50MB memory advisory. |
| 2 | **Video Converter** | `video-converter` | `/tool/video-converter` | FFmpeg WASM (Single-Threaded) | Transcode between MP4, WebM, MOV, and MKV in-browser. Runtime progress reporting and virtual Emscripten FS cleanup. |
| 3 | **Video to GIF Maker** | `video-to-gif` | `/tool/video-to-gif` | FFmpeg WASM (2-Pass Palette) | Custom start/end timestamps, width presets (320px, 480px, 640px), frame rate controls (10, 15, 24 FPS), high-visibility GIF file size advisory. |
| 4 | **Extract Audio from Video** | `video-audio-extract` | `/tool/video-audio-extract` | Web Audio API (WAV) + FFmpeg (MP3) | Instant lossless 16-bit PCM WAV extraction via native Web Audio API (0MB download), or standard MP3 extraction via FFmpeg WASM. Audio preview player. |
| 5 | **Audio Format Converter** | `audio-converter` | `/tool/audio-converter` | Web Audio API + FFmpeg WASM | Transcode audio to WAV (lossless instant), MP3 (LAME), AAC, or OGG (Vorbis). Only advertises genuinely supported formats with real outputs. |
| 6 | **Audio Trimmer** | `audio-trimmer` | `/tool/audio-trimmer` | Native Web Audio API | Sample-accurate slicing in browser RAM. Instant duration detection, interactive start/end timestamp controls, zero network overhead, instant WAV export. |
| 7 | **Audio Volume Normalizer** | `audio-normalizer` | `/tool/audio-normalizer` | Native Web Audio API | Peak sample normalization to -0.1 dBFS, -1.0 dBFS, or -3.0 dBFS. Scans all channels, calculates optimal linear gain, prevents digital clipping, and displays gain change. |

---

## Hardware & Browser Limitations (100% Client-Side)

1. **Browser Tab Memory**: Recommended maximum single file size for heavy browser operations is ~100MB–200MB depending on client device RAM. Files exceeding 50MB will trigger an advisory warning.
2. **Zero Server Transmission**: 100% of processing runs inside the browser tab runtime (`window`, `Web Worker`, `Canvas`, `SubtleCrypto`, `JSZip`, `pdf-lib`, `xlsx`, `AudioContext`, `@ffmpeg/ffmpeg` WASM). Zero bytes of user data ever reach any remote server or API.
3. **No Third-Party Cookies or Telemetry**: Zero tracking scripts, zero ads.
4. **Lazy-Loaded WebAssembly**: FFmpeg WASM binaries (~25MB) are loaded on-demand only when a video/transcoding tool is opened, leaving the homepage and pure audio tools completely lightweight (0MB WASM overhead).


