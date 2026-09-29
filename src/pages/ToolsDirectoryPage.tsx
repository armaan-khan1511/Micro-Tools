import React, { useState, useMemo, useEffect, useRef } from 'react'
import { TOOLS, CATEGORIES, searchTools } from '../config/toolsRegistry'
import type { ToolCategory } from '../types/tool'
import { ToolCard } from '../components/common/ToolCard'
import { Search, X, SlidersHorizontal } from 'lucide-react'

interface ToolsDirectoryPageProps {
  initialCategory?: ToolCategory | 'all'
  onSelectTool: (toolId: string) => void
}

export const ToolsDirectoryPage: React.FC<ToolsDirectoryPageProps> = ({
  initialCategory = 'all',
  onSelectTool,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'all'>(initialCategory)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Sync if initialCategory changes
  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory)
    }
  }, [initialCategory])

  // Filter tools
  const filteredTools = useMemo(() => {
    return searchTools(
      searchQuery,
      selectedCategory === 'all' ? undefined : selectedCategory
    )
  }, [searchQuery, selectedCategory])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    searchInputRef.current?.focus()
  }

  return (
    <div className="directory-page-container">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Tool Directory</h1>
        <p className="page-subtitle">
          Browse and search our full collection of client-side utilities.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="directory-controls">
        {/* Search Box */}
        <div className="search-bar-wrapper">
          <Search size={18} className="search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="Search tools by name, description, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search tools"
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="category-filter-pills" role="tablist" aria-label="Category filters">
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === 'all'}
            className={`category-pill ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All Tools ({TOOLS.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = TOOLS.filter((t) => {
              if (cat.id === 'audio-video') return t.category === 'audio-video' || t.category === 'audio' || t.category === 'video'
              if (cat.id === 'utilities') return t.category === 'utilities' || t.category === 'archive' || t.category === 'utility'
              return t.category === cat.id
            }).length

            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={selectedCategory === cat.id}
                className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Results Header */}
      <div className="results-status-bar">
        <span className="results-count">
          Showing <strong>{filteredTools.length}</strong> {filteredTools.length === 1 ? 'tool' : 'tools'}
          {selectedCategory !== 'all' && (
            <> in <em>{CATEGORIES.find((c) => c.id === selectedCategory)?.name || selectedCategory}</em></>
          )}
          {searchQuery && <> matching &quot;{searchQuery}&quot;</>}
        </span>

        {(searchQuery || selectedCategory !== 'all') && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={clearFilters}
            style={{ fontSize: '0.8rem' }}
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Tools Grid */}
      {filteredTools.length > 0 ? (
        <div className="tools-grid">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} onClick={onSelectTool} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <SlidersHorizontal size={40} className="empty-state-icon" />
          <h3 className="empty-state-title">No matching tools found</h3>
          <p className="empty-state-desc">
            Try adjusting your search query or choosing a different category.
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={clearFilters}
          >
            Clear Search & Filters
          </button>
        </div>
      )}
    </div>
  )
}
