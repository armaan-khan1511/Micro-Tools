export type ToolCategory =
  | 'pdf'
  | 'image'
  | 'audio-video'
  | 'archive'
  | 'document'
  | 'utility'

export interface ToolDefinition {
  id: string
  name: string
  category: ToolCategory
  description: string
  icon: string
  tags: string[]
  badges: string[]
  accepts?: string[]
  maxFileSizeMb?: number
  isFeatured?: boolean
}

export interface CategoryInfo {
  id: ToolCategory
  name: string
  description: string
  icon: string
  count?: number
}
