import React, { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

// --- LAZY-LOADED TOOL CATEGORIES FOR OPTIMAL CODE SPLITTING ---
// PDF Tools
const PdfMergeView = React.lazy(() =>
  import('./pdf/PdfToolsViews').then((m) => ({ default: m.PdfMergeView }))
)
const PdfSplitView = React.lazy(() =>
  import('./pdf/PdfToolsViews').then((m) => ({ default: m.PdfSplitView }))
)
const PdfExtractPagesView = React.lazy(() =>
  import('./pdf/PdfToolsViews').then((m) => ({ default: m.PdfExtractPagesView }))
)
const ImagesToPdfView = React.lazy(() =>
  import('./pdf/PdfToolsViews').then((m) => ({ default: m.ImagesToPdfView }))
)
const PdfToImagesView = React.lazy(() =>
  import('./pdf/PdfToolsViews').then((m) => ({ default: m.PdfToImagesView }))
)
const PdfRotateView = React.lazy(() =>
  import('./pdf/PdfToolsViews').then((m) => ({ default: m.PdfRotateView }))
)
const PdfExtractTextView = React.lazy(() =>
  import('./pdf/PdfToolsViews').then((m) => ({ default: m.PdfExtractTextView }))
)
const PdfCompressView = React.lazy(() =>
  import('./pdf/PdfToolsViews').then((m) => ({ default: m.PdfCompressView }))
)
const PdfWatermarkView = React.lazy(() =>
  import('./pdf/PdfToolsViews').then((m) => ({ default: m.PdfWatermarkView }))
)
const PdfUnlockView = React.lazy(() =>
  import('./pdf/PdfToolsViews').then((m) => ({ default: m.PdfUnlockView }))
)
const PdfProtectView = React.lazy(() =>
  import('./pdf/PdfToolsViews').then((m) => ({ default: m.PdfProtectView }))
)
const PdfToWordView = React.lazy(() =>
  import('./pdf/PdfToolsViews').then((m) => ({ default: m.PdfToWordView }))
)
const PdfToExcelView = React.lazy(() =>
  import('./pdf/PdfToolsViews').then((m) => ({ default: m.PdfToExcelView }))
)

// Image Tools
const ImageCompressView = React.lazy(() =>
  import('./image/ImageToolsViews').then((m) => ({ default: m.ImageCompressView }))
)
const ImageResizeView = React.lazy(() =>
  import('./image/ImageToolsViews').then((m) => ({ default: m.ImageResizeView }))
)
const ImageCropView = React.lazy(() =>
  import('./image/ImageToolsViews').then((m) => ({ default: m.ImageCropView }))
)
const ImageConvertView = React.lazy(() =>
  import('./image/ImageToolsViews').then((m) => ({ default: m.ImageConvertView }))
)
const ImageRotateFlipView = React.lazy(() =>
  import('./image/ImageToolsViews').then((m) => ({ default: m.ImageRotateFlipView }))
)
const ImageWatermarkView = React.lazy(() =>
  import('./image/ImageToolsViews').then((m) => ({ default: m.ImageWatermarkView }))
)
const ImageEnhanceView = React.lazy(() =>
  import('./image/ImageToolsViews').then((m) => ({ default: m.ImageEnhanceView }))
)
const ImageBackgroundRemoveView = React.lazy(() =>
  import('./image/ImageToolsViews').then((m) => ({ default: m.ImageBackgroundRemoveView }))
)
const ColorPaletteView = React.lazy(() =>
  import('./image/ImageToolsViews').then((m) => ({ default: m.ColorPaletteView }))
)
const ExifStripperView = React.lazy(() =>
  import('./image/ImageToolsViews').then((m) => ({ default: m.ExifStripperView }))
)

// Archive Tools
const ZipCreatorView = React.lazy(() =>
  import('./archive/ArchiveToolsViews').then((m) => ({ default: m.ZipCreatorView }))
)
const ZipExtractorView = React.lazy(() =>
  import('./archive/ArchiveToolsViews').then((m) => ({ default: m.ZipExtractorView }))
)
const FileHashView = React.lazy(() =>
  import('./archive/ArchiveToolsViews').then((m) => ({ default: m.FileHashView }))
)
const Base64View = React.lazy(() =>
  import('./archive/ArchiveToolsViews').then((m) => ({ default: m.Base64View }))
)
const Base64EncoderView = React.lazy(() =>
  import('./archive/ArchiveToolsViews').then((m) => ({ default: m.Base64EncoderView }))
)
const Base64DecoderView = React.lazy(() =>
  import('./archive/ArchiveToolsViews').then((m) => ({ default: m.Base64DecoderView }))
)

// Audio & Video Tools
const VideoCompressView = React.lazy(() =>
  import('./audio-video/AudioVideoToolsViews').then((m) => ({ default: m.VideoCompressView }))
)
const VideoConverterView = React.lazy(() =>
  import('./audio-video/AudioVideoToolsViews').then((m) => ({ default: m.VideoConverterView }))
)
const VideoToGifView = React.lazy(() =>
  import('./audio-video/AudioVideoToolsViews').then((m) => ({ default: m.VideoToGifView }))
)
const VideoAudioExtractView = React.lazy(() =>
  import('./audio-video/AudioVideoToolsViews').then((m) => ({ default: m.VideoAudioExtractView }))
)
const AudioConverterView = React.lazy(() =>
  import('./audio-video/AudioVideoToolsViews').then((m) => ({ default: m.AudioConverterView }))
)
const AudioTrimmerView = React.lazy(() =>
  import('./audio-video/AudioVideoToolsViews').then((m) => ({ default: m.AudioTrimmerView }))
)
const AudioNormalizerView = React.lazy(() =>
  import('./audio-video/AudioVideoToolsViews').then((m) => ({ default: m.AudioNormalizerView }))
)

// Document & Text Tools
const MarkdownPreviewView = React.lazy(() =>
  import('./document/DocumentToolsViews').then((m) => ({ default: m.MarkdownPreviewView }))
)
const WordCounterView = React.lazy(() =>
  import('./document/DocumentToolsViews').then((m) => ({ default: m.WordCounterView }))
)
const TextDiffView = React.lazy(() =>
  import('./document/DocumentToolsViews').then((m) => ({ default: m.TextDiffView }))
)
const JsonFormatterView = React.lazy(() =>
  import('./document/DocumentToolsViews').then((m) => ({ default: m.JsonFormatterView }))
)
const JsonMinifierView = React.lazy(() =>
  import('./document/DocumentToolsViews').then((m) => ({ default: m.JsonMinifierView }))
)
const TextConverterView = React.lazy(() =>
  import('./document/DocumentToolsViews').then((m) => ({ default: m.TextConverterView }))
)
const CaseConverterView = React.lazy(() =>
  import('./document/DocumentToolsViews').then((m) => ({ default: m.CaseConverterView }))
)
const TextToPdfView = React.lazy(() =>
  import('./document/DocumentToolsViews').then((m) => ({ default: m.TextToPdfView }))
)
const MarkdownToHtmlView = React.lazy(() =>
  import('./document/DocumentToolsViews').then((m) => ({ default: m.MarkdownToHtmlView }))
)
const MarkdownToPdfView = React.lazy(() =>
  import('./document/DocumentToolsViews').then((m) => ({ default: m.MarkdownToPdfView }))
)
const WordToPdfView = React.lazy(() =>
  import('./document/DocumentToolsViews').then((m) => ({ default: m.WordToPdfView }))
)
const CsvToExcelView = React.lazy(() =>
  import('./document/SpreadsheetToolsViews').then((m) => ({ default: m.CsvToExcelView }))
)
const ExcelToCsvView = React.lazy(() =>
  import('./document/SpreadsheetToolsViews').then((m) => ({ default: m.ExcelToCsvView }))
)

// Utility Tools
const QrGeneratorView = React.lazy(() =>
  import('./utility/UtilityToolsViews').then((m) => ({ default: m.QrGeneratorView }))
)
const PasswordGeneratorView = React.lazy(() =>
  import('./utility/UtilityToolsViews').then((m) => ({ default: m.PasswordGeneratorView }))
)
const UuidGeneratorView = React.lazy(() =>
  import('./utility/UtilityToolsViews').then((m) => ({ default: m.UuidGeneratorView }))
)
const ColorContrastView = React.lazy(() =>
  import('./utility/UtilityToolsViews').then((m) => ({ default: m.ColorContrastView }))
)
const FileMetadataView = React.lazy(() =>
  import('./utility/MetadataToolsViews').then((m) => ({ default: m.FileMetadataView }))
)

const ToolLoadingFallback = () => (
  <div
    style={{
      padding: '4rem 2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      color: 'var(--text-secondary)',
    }}
  >
    <Loader2 className="spin" size={36} color="var(--accent-primary)" />
    <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>
      Loading tool module in browser...
    </span>
  </div>
)

interface ToolViewRouterProps {
  toolId: string
}

export const ToolViewRouter: React.FC<ToolViewRouterProps> = ({ toolId }) => {
  const renderView = () => {
    switch (toolId) {
      // --- PDF ---
      case 'pdf-merge':
        return <PdfMergeView />
      case 'pdf-split':
        return <PdfSplitView />
      case 'pdf-extract-pages':
      case 'pdf-organize':
        return <PdfExtractPagesView />
      case 'images-to-pdf':
      case 'jpg-to-pdf':
      case 'png-to-pdf':
        return <ImagesToPdfView />
      case 'pdf-to-images':
        return <PdfToImagesView />
      case 'pdf-to-jpg':
        return <PdfToImagesView defaultFormat="jpeg" />
      case 'pdf-to-png':
        return <PdfToImagesView defaultFormat="png" />
      case 'pdf-rotate':
        return <PdfRotateView />
      case 'pdf-extract-text':
      case 'pdf-to-text':
        return <PdfExtractTextView />
      case 'pdf-compress':
        return <PdfCompressView />
      case 'pdf-watermark':
        return <PdfWatermarkView />
      case 'pdf-unlock':
        return <PdfUnlockView />
      case 'pdf-protect':
        return <PdfProtectView />
      case 'pdf-to-word':
        return <PdfToWordView />
      case 'pdf-to-excel':
        return <PdfToExcelView />

      // --- IMAGE ---
      case 'image-compress':
        return <ImageCompressView />
      case 'image-resize':
        return <ImageResizeView />
      case 'image-crop':
      case 'image-cropper':
        return <ImageCropView />
      case 'image-convert':
      case 'svg-to-png':
        return <ImageConvertView />
      case 'jpg-to-png':
        return <ImageConvertView defaultTarget="png" />
      case 'png-to-jpg':
        return <ImageConvertView defaultTarget="jpg" />
      case 'jpg-to-webp':
        return <ImageConvertView defaultTarget="webp" />
      case 'png-to-webp':
        return <ImageConvertView defaultTarget="webp" />
      case 'webp-to-jpg':
        return <ImageConvertView defaultTarget="jpg" />
      case 'webp-to-png':
        return <ImageConvertView defaultTarget="png" />
      case 'image-rotate':
      case 'image-rotator':
      case 'image-flip':
      case 'image-flipper':
        return <ImageRotateFlipView />
      case 'image-watermark':
      case 'meme-watermark':
        return <ImageWatermarkView />
      case 'image-enhancer':
      case 'image-filters':
        return <ImageEnhanceView />
      case 'image-background-remover':
        return <ImageBackgroundRemoveView />
      case 'color-palette':
        return <ColorPaletteView />
      case 'exif-stripper':
        return <ExifStripperView />

      // --- ARCHIVE ---
      case 'zip-creator':
        return <ZipCreatorView />
      case 'zip-extractor':
        return <ZipExtractorView />
      case 'file-hash':
      case 'file-checksum':
        return <FileHashView />
      case 'base64-converter':
        return <Base64View />
      case 'base64-encoder':
        return <Base64EncoderView />
      case 'base64-decoder':
        return <Base64DecoderView />

      // --- AUDIO & VIDEO ---
      case 'video-compress':
      case 'video-compressor':
        return <VideoCompressView />
      case 'video-converter':
        return <VideoConverterView />
      case 'video-to-gif':
        return <VideoToGifView />
      case 'video-audio-extract':
        return <VideoAudioExtractView />
      case 'audio-converter':
        return <AudioConverterView />
      case 'audio-trimmer':
      case 'audio-speed':
        return <AudioTrimmerView />
      case 'audio-normalizer':
      case 'volume-normalizer':
        return <AudioNormalizerView />

      // --- DOCUMENT & TEXT ---
      case 'markdown-preview':
      case 'html-to-markdown':
        return <MarkdownPreviewView />
      case 'word-counter':
        return <WordCounterView />
      case 'text-diff':
        return <TextDiffView />
      case 'case-converter':
        return <CaseConverterView />
      case 'json-formatter':
      case 'csv-json-converter':
        return <JsonFormatterView />
      case 'json-minifier':
        return <JsonMinifierView />
      case 'text-converter':
      case 'text-file-converter':
        return <TextConverterView />
      case 'text-to-pdf':
        return <TextToPdfView />
      case 'markdown-to-html':
        return <MarkdownToHtmlView />
      case 'markdown-to-pdf':
        return <MarkdownToPdfView />
      case 'word-to-pdf':
      case 'docx-to-pdf':
        return <WordToPdfView />
      case 'csv-to-excel':
      case 'csv-to-xlsx':
        return <CsvToExcelView />
      case 'excel-to-csv':
      case 'xlsx-to-csv':
        return <ExcelToCsvView />

      // --- UTILITIES ---
      case 'qr-generator':
      case 'qr-scanner':
        return <QrGeneratorView />
      case 'password-generator':
        return <PasswordGeneratorView />
      case 'uuid-generator':
        return <UuidGeneratorView />
      case 'color-converter':
        return <ColorContrastView />
      case 'file-metadata':
      case 'metadata-viewer':
        return <FileMetadataView />

      default:
        return (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>
              This tool is undergoing browser optimization. Check back shortly.
            </p>
          </div>
        )
    }
  }

  return <Suspense fallback={<ToolLoadingFallback />}>{renderView()}</Suspense>
}
