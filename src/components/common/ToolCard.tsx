import React from 'react'
import type { ToolDefinition } from '../../core/types/tool'
import { ToolIcon } from './ToolIcon'
import { ArrowRight, ShieldCheck } from 'lucide-react'

interface ToolCardProps {
  tool: ToolDefinition
  onClick: (toolId: string) => void
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
      <div className="tool-card-header">
        <div className="tool-card-icon">
          <ToolIcon name={tool.icon} size={20} />
        </div>
        <span className="badge" style={{ fontSize: '0.7rem' }}>
          {tool.category}
        </span>
      </div>

      <h3 className="tool-card-title">{tool.name}</h3>
      <p className="tool-card-desc">{tool.description}</p>

      <div className="tool-card-footer">
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--accent-emerald)' }}>
          <ShieldCheck size={13} /> Browser Local
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}>
          Open <ArrowRight size={13} />
        </span>
      </div>
    </a>
  )
}
