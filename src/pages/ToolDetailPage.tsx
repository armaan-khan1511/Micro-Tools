import React from 'react'
import type { ToolDefinition } from '../types/tool'
import { ToolIcon } from '../components/common/ToolIcon'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

interface ToolDetailPageProps {
  tool: ToolDefinition
  onBack: () => void
  onSelectTool?: (toolId: string) => void
  children: React.ReactNode
}

export const ToolDetailPage: React.FC<ToolDetailPageProps> = ({
  tool,
  onBack,
  children,
}) => {
  return (
    <div className="tool-page-container">
      {/* Back Link / Breadcrumb */}
      <nav className="tool-breadcrumb-nav" aria-label="Breadcrumb">
        <button type="button" className="tool-back-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to Tools</span>
        </button>
        <span className="tool-breadcrumb-divider">/</span>
        <span className="tool-breadcrumb-current">{tool.name}</span>
      </nav>

      {/* Tool Header */}
      <div className="tool-header-block">
        <div className="tool-title-row">
          <div className="tool-header-icon">
            <ToolIcon name={tool.icon} size={26} />
          </div>
          <div className="tool-title-info">
            <h1 className="tool-header-title">{tool.name}</h1>
            <p className="tool-header-description">{tool.description}</p>
          </div>
        </div>

        {/* Clean, Understated Privacy Note */}
        <div className="tool-privacy-note">
          <ShieldCheck size={16} className="tool-privacy-icon" />
          <span>
            <strong>Client-Side Processing:</strong> Your files never leave your device. All computations occur locally in your browser.
          </span>
        </div>
      </div>

      {/* Interactive Tool Workspace */}
      <div className="tool-workspace-card">
        {children}
      </div>
    </div>
  )
}
