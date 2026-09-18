import React, { useState, useMemo, useEffect, useRef } from 'react'
import { TOOLS, CATEGORIES } from '../data/toolsRegistry'
import type { ToolCategory } from '../core/types/tool'
import { ToolCard } from '../components/common/ToolCard'
import { ToolIcon } from '../components/common/ToolIcon'
import { Search, ShieldCheck, Zap, Lock, Sparkles } from 'lucide-react'

interface HomePageProps {
  onSelectTool: (toolId: string) => void
}

export const HomePage: React.FC<HomePageProps> = ({ onSelectTool }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'all'>('all')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcut Ctrl+K / Cmd+K to focus search
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

  // Filter tools by search query and category
  const filteredTools = useMemo(() => {
    return TOOLS.filter((tool) => {
      const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory
      if (!matchesCategory) return false

      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      const titleMatch = tool.name.toLowerCase().includes(q)
      const descMatch = tool.description.toLowerCase().includes(q)
      const tagMatch = tool.tags.some((tag) => tag.toLowerCase().includes(q))
      return titleMatch || descMatch || tagMatch
    })
  }, [searchQuery, selectedCategory])

  // Count per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: TOOLS.length }
    for (const tool of TOOLS) {
      counts[tool.category] = (counts[tool.category] || 0) + 1
    }
    return counts
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', maxWidth: '780px', margin: '1rem auto 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
        <div className="badge badge-green" style={{ padding: '0.35rem 0.85rem' }}>
          <ShieldCheck size={14} /> 100% In-Browser & Local Execution
        </div>

        <h1 style={{ fontSize: 'clamp(2.1rem, 4vw, 3.2rem)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
          Fast, Private Web Tools. <br />
          <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
            Zero server uploads.
          </span>
        </h1>

        <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '620px' }}>
          A curated suite of {TOOLS.length} focused browser utilities for PDFs, images, media, archives, and text.
          Your sensitive files never leave your device.
        </p>

        {/* Instant Search Bar */}
        <div className="search-wrapper" style={{ marginTop: '0.75rem' }}>
          <Search size={18} className="search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="Search all 40 tools (e.g. compress, merge pdf, zip, qr)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search tools"
          />
          <span className="search-kbd">Ctrl K</span>
        </div>
      </section>

      {/* Category Tabs */}
      <section>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
            scrollbarWidth: 'none',
          }}
        >
          <button
            type="button"
            className={`btn ${selectedCategory === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-full)', padding: '0.45rem 1rem', fontSize: '0.85rem' }}
            onClick={() => setSelectedCategory('all')}
          >
            All Tools ({categoryCounts.all})
          </button>

          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 'var(--radius-full)', padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <ToolIcon name={cat.icon} size={15} />
                {cat.name} ({categoryCounts[cat.id] || 0})
              </button>
            )
          })}
        </div>

        {/* Filter results info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <span>
            Showing {filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'}
            {searchQuery ? ` matching "${searchQuery}"` : ''}
          </span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ color: 'var(--accent-primary)', textDecoration: 'underline', fontSize: '0.85rem' }}
            >
              Clear filter
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
          <div
            style={{
              padding: '4rem 2rem',
              textAlign: 'center',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              marginTop: '1.5rem',
            }}
          >
            <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              No tools found matching "{searchQuery}"
            </p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Try searching for a different keyword like "pdf", "image", "audio", "zip", or "text".
            </p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('all')
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* Trust & Architecture Banner */}
      <section
        style={{
          padding: '2rem',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald)' }}>
            <Lock size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              Absolute Data Privacy
            </h4>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Files are converted using pure WebAssembly, Canvas, and HTML5 APIs. Zero bytes ever upload to remote servers.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: 'var(--radius-md)', background: 'rgba(14, 165, 233, 0.1)', color: 'var(--accent-primary)' }}>
            <Zap size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              Sub-Millisecond Processing
            </h4>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              No upload queues, network lag, or upload timeouts. Processing is powered directly by your device hardware.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
          <div style={{ padding: '0.6rem', borderRadius: 'var(--radius-md)', background: 'rgba(168, 85, 247, 0.1)', color: 'var(--accent-purple)' }}>
            <Sparkles size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              Free & Open Source
            </h4>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Built with battle-tested open-source libraries under MIT and Apache 2.0 licenses. No account or subscription needed.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
