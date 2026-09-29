import React from 'react'
import type { ToolDefinition } from '../../types/tool'
import { ToolIcon } from './ToolIcon'
import { ArrowRight } from 'lucide-react'

interface ToolCardProps {
  tool: ToolDefinition
  onClick: (toolId: string) => void
}

const getCategoryLabel = (cat: string) => {
  switch (cat) {
    case 'pdf':
      return 'PDF'
    case 'image':
      return 'Image'
    case 'document':
      return 'Document'
    case 'audio-video':
    case 'video':
    case 'audio':
      return 'Video & Audio'
    case 'compression':
      return 'Compression'
    case 'utilities':
    case 'archive':
    case 'utility':
      return 'Utilities'
    default:
      return cat
  }
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onClick }) => {
  return (
    <a
      href={`/tool/${tool.id}`}
      className="tool-card"
      onClick={(e) => {
        e.preventDefault()
        onClick(tool.id)
      }}
    >
      <div className="tool-card-top">
        <div className="tool-card-icon">
          <ToolIcon name={tool.icon} size={20} />
        </div>
        <span className="tool-card-category">{getCategoryLabel(tool.category)}</span>
      </div>

      <h3 className="tool-card-title">{tool.name}</h3>
      <p className="tool-card-desc">{tool.description}</p>

      <div className="tool-card-action">
        <span>Open Tool</span>
        <ArrowRight size={14} className="tool-card-arrow" />
      </div>
    </a>
  )
}
