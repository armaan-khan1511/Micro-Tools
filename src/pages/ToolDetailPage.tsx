import React from 'react'
import type { ToolDefinition } from '../core/types/tool'
import { ToolIcon } from '../components/common/ToolIcon'
import { ArrowLeft, ShieldCheck, Info } from 'lucide-react'

interface ToolDetailPageProps {
  tool: ToolDefinition
  onBack: () => void
  children: React.ReactNode
}

export const ToolDetailPage: React.FC<ToolDetailPageProps> = ({ tool, onBack, children }) => {
  return (
    <div className="tool-view-wrapper">
      {/* Header Bar */}
      <div className="tool-header-bar">
        <button type="button" className="tool-back-link" onClick={onBack}>
          <ArrowLeft size={16} /> Back to All Tools
        </button>

        <div className="tool-title-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="tool-card-icon" style={{ width: '48px', height: '48px' }}>
              <ToolIcon name={tool.icon} size={24} />
            </div>
            <div>
              <h1 className="tool-title">{tool.name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <span className="badge">{tool.category.toUpperCase()}</span>
                {tool.badges.map((badge, idx) => (
                  <span key={idx} className="badge badge-green">
                    <ShieldCheck size={11} /> {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="tool-description">{tool.description}</p>

        {/* Real Privacy Assurance */}
        <div className="privacy-banner">
          <ShieldCheck size={18} style={{ flexShrink: 0 }} />
          <span>
            <strong>Client-Side Processing:</strong> Your files remain 100% private. All computations occur
            in your browser memory and are discarded when you close or reload this tab.
          </span>
        </div>
      </div>

      {/* Main Tool Interactive Area */}
      <div className="card" style={{ padding: '2rem' }}>
        {children}
      </div>

      {/* Safety and Performance Disclosures */}
      {tool.maxFileSizeMb && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <Info size={15} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
          <span>
            Recommended browser tab safety ceiling: <strong>{tool.maxFileSizeMb} MB</strong>. For extremely
            large files, close unnecessary browser tabs to free up system memory.
          </span>
        </div>
      )}
    </div>
  )
}
