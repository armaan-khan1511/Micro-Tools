import React from 'react'
import {
  PdfMergeView,
  PdfSplitView,
  ImagesToPdfView,
  PdfRotateView,
} from './pdf/PdfToolsViews'
import {
  ImageCompressView,
  ImageConvertView,
  ColorPaletteView,
  ExifStripperView,
} from './image/ImageToolsViews'
import {
  ZipCreatorView,
  ZipExtractorView,
  FileHashView,
  Base64View,
} from './archive/ArchiveToolsViews'
import {
  MarkdownPreviewView,
  WordCounterView,
  TextDiffView,
  JsonFormatterView,
  CaseConverterView,
} from './document/DocumentToolsViews'
import {
  QrGeneratorView,
  PasswordGeneratorView,
  UuidGeneratorView,
  ColorContrastView,
} from './utility/UtilityToolsViews'
import {
  AudioTrimmerView,
  AudioConverterView,
  VideoAudioExtractView,
} from './audio-video/AudioVideoToolsViews'

interface ToolViewRouterProps {
  toolId: string
}

export const ToolViewRouter: React.FC<ToolViewRouterProps> = ({ toolId }) => {
  switch (toolId) {
    // --- PDF ---
    case 'pdf-merge':
      return <PdfMergeView />
    case 'pdf-split':
    case 'pdf-to-images':
    case 'pdf-extract-text':
      return <PdfSplitView />
    case 'images-to-pdf':
      return <ImagesToPdfView />
    case 'pdf-rotate':
    case 'pdf-protect':
    case 'pdf-organize':
      return <PdfRotateView />

    // --- IMAGE ---
    case 'image-compress':
    case 'image-resize':
    case 'image-crop':
    case 'image-filters':
      return <ImageCompressView />
    case 'image-convert':
    case 'svg-to-png':
      return <ImageConvertView />
    case 'color-palette':
      return <ColorPaletteView />
    case 'exif-stripper':
    case 'meme-watermark':
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

    // --- AUDIO & VIDEO ---
    case 'audio-trimmer':
    case 'audio-speed':
      return <AudioTrimmerView />
    case 'audio-converter':
      return <AudioConverterView />
    case 'video-audio-extract':
    case 'video-to-gif':
    case 'video-mute':
      return <VideoAudioExtractView />

    // --- DOCUMENT & TEXT ---
    case 'markdown-preview':
      return <MarkdownPreviewView />
    case 'html-to-markdown':
    case 'markdown-preview':
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
