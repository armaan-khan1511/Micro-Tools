import React, { useState, useEffect, useRef } from 'react'
import { CATEGORIES, getPopularTools, searchTools, TOOLS } from '../config/toolsRegistry'
import type { ToolCategory, ToolDefinition } from '../types/tool'
import { ToolCard } from '../components/common/ToolCard'
import { ToolIcon } from '../components/common/ToolIcon'
import { Search, ArrowRight, ShieldCheck } from 'lucide-react'

interface HomePageProps {
  onSelectTool: (toolId: string) => void
  onNavigateToDirectory: (category?: ToolCategory) => void
  onNavigateToCategories: () => void
}

export const HomePage: React.FC<HomePageProps> = ({
  onSelectTool,
  onNavigateToDirectory,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ToolDefinition[]>([])
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  const popularTools = getPopularTools()

  // Shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Live search filtering
  useEffect(() => {
    if (searchQuery.trim()) {
      setSearchResults(searchTools(searchQuery).slice(0, 6))
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchResults.length > 0) {
      onSelectTool(searchResults[0].id)
    } else {
      onNavigateToDirectory()
    }
  }

  return (
    <div className="home-page-container">
      {/* 1. Hero Section */}
      <section className="hero-section">
        <div className="hero-privacy-badge">
          <ShieldCheck size={14} />
          <span>100% In-Browser & Local Execution</span>
        </div>

        {/* Short hero heading */}
        <h1 className="hero-title">
          Clean, private tools for everyday tasks.
        </h1>

        {/* One-line description */}
        <p className="hero-desc">
          Convert, compress, and edit files directly in your browser — zero file uploads.
        </p>

        {/* 3. Prominent Search Bar */}
        <div ref={searchContainerRef} className="hero-search-container">
          <form onSubmit={handleSearchSubmit} className="hero-search-form">
            <Search size={20} className="hero-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="hero-search-input"
              placeholder="Search 35+ tools (e.g., merge pdf, compress image, zip, hash)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              aria-label="Search tools"
            />
            <kbd className="hero-search-kbd">⌘K</kbd>
          </form>

          {/* Autocomplete Suggestions Dropdown */}
          {isSearchFocused && searchResults.length > 0 && (
            <div className="hero-search-dropdown" role="listbox">
              {searchResults.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  className="search-dropdown-item"
                  onClick={() => {
                    setIsSearchFocused(false)
                    onSelectTool(tool.id)
                  }}
                >
                  <div className="search-dropdown-icon">
                    <ToolIcon name={tool.icon} size={16} />
                  </div>
                  <div className="search-dropdown-info">
                    <span className="search-dropdown-name">{tool.name}</span>
                    <span className="search-dropdown-desc">{tool.description}</span>
                  </div>
                  <span className="search-dropdown-cat">{tool.category}</span>
                </button>
              ))}

              <button
                type="button"
                className="search-dropdown-view-all"
                onClick={() => {
                  setIsSearchFocused(false)
                  onNavigateToDirectory()
                }}
              >
                <span>View all search results in Directory</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 4. Popular Tools Section */}
      <section className="home-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Popular Tools</h2>
            <p className="section-subtitle">
              Common client-side utilities ready for immediate use.
            </p>
          </div>
          <button
            type="button"
            className="section-link-btn"
            onClick={() => onNavigateToDirectory()}
          >
            <span>View all ({TOOLS.length})</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="tools-grid">
          {popularTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} onClick={onSelectTool} />
          ))}
        </div>
      </section>

      {/* 5. Category Cards Section */}
      <section className="home-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Browse by Category</h2>
            <p className="section-subtitle">
              Explore specialized toolsets grouped by format and function.
            </p>
          </div>
        </div>

        <div className="category-cards-grid">
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
                className="category-card"
                onClick={() => onNavigateToDirectory(cat.id)}
              >
                <div className="category-card-top">
                  <div className="category-card-icon">
                    <ToolIcon name={cat.icon} size={22} />
                  </div>
                  <span className="category-card-count">{count} tools</span>
                </div>
                <h3 className="category-card-name">{cat.name}</h3>
                <p className="category-card-desc">{cat.description}</p>
                <div className="category-card-action">
                  <span>Explore tools</span>
                  <ArrowRight size={14} />
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* 6. View All Tools CTA Section */}
      <section className="home-cta-section">
        <div className="home-cta-card">
          <h2 className="home-cta-title">Looking for a specific utility?</h2>
          <p className="home-cta-desc">
            Explore our complete searchable directory of 35+ browser-native micro-tools.
          </p>
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={() => onNavigateToDirectory()}
          >
            <span>Open Tool Directory</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </div>
  )
}
