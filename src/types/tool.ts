export type ToolCategory =
  | 'pdf'
  | 'image'
  | 'document'
  | 'audio-video'
  | 'compression'
  | 'utilities'
  // Backward compatibility aliases
  | 'video'
  | 'audio'
  | 'archive'
  | 'utility'

export type ProcessingMethod = 'browser-native' | 'library' | 'worker' | 'wasm'

export type ToolStatus = 'ready' | 'beta' | 'planned'

export interface ToolDefinition {
  id: string
  name: string
  description: string
  category: ToolCategory
  route: string
  icon: string
  acceptedFileTypes: string[]
  supportsMultipleFiles: boolean
  processingMethod: ProcessingMethod
  status: ToolStatus
  limitations: string
  tags: string[]
  badges: string[]
  maxFileSizeMb?: number
  isFeatured?: boolean
  isPopular?: boolean
  accepts?: string[]
}

export interface CategoryInfo {
  id: ToolCategory
  name: string
  description: string
  icon: string
  count?: number
}
