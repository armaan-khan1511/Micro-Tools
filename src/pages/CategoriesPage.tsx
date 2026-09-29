import React from 'react'
import { CATEGORIES, getToolsByCategory } from '../config/toolsRegistry'
import type { ToolCategory } from '../types/tool'
import { ToolCard } from '../components/common/ToolCard'
import { ToolIcon } from '../components/common/ToolIcon'
import { ArrowRight } from 'lucide-react'

interface CategoriesPageProps {
  onSelectCategory: (category: ToolCategory) => void
  onSelectTool: (toolId: string) => void
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  onSelectCategory,
  onSelectTool,
}) => {
  return (
    <div className="categories-page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Tool Categories</h1>
        <p className="page-subtitle">
          Explore our complete collection organized by task and file format.
        </p>
      </div>

      {/* Category Sections */}
      <div className="category-sections-list">
        {CATEGORIES.map((cat) => {
          const categoryTools = getToolsByCategory(cat.id)
          const previewTools = categoryTools.slice(0, 4)

          return (
            <section key={cat.id} className="category-section">
              {/* Category Header */}
              <div className="category-section-header">
                <div className="category-section-title-group">
                  <div className="category-icon-wrapper">
                    <ToolIcon name={cat.icon} size={22} />
                  </div>
                  <div>
                    <h2 className="category-section-name">{cat.name}</h2>
                    <p className="category-section-desc">{cat.description}</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="category-view-all-btn"
                  onClick={() => onSelectCategory(cat.id)}
                >
                  <span>View all {categoryTools.length} {cat.name}</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Featured Tools in Category */}
              <div className="tools-grid">
                {previewTools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} onClick={onSelectTool} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
