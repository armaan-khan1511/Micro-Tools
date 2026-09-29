import React, { useState, useEffect } from 'react'
import { Sun, Moon, Wrench, Menu, X } from 'lucide-react'

interface HeaderProps {
  currentPath: string
  onNavigate: (path: string) => void
}

export const Header: React.FC<HeaderProps> = ({ currentPath, onNavigate }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('microtools-theme') as 'dark' | 'light' | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.setAttribute('data-theme', savedTheme)
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light')
      document.documentElement.setAttribute('data-theme', 'light')
    }
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    document.documentElement.setAttribute('data-theme', nextTheme)
    localStorage.setItem('microtools-theme', nextTheme)
  }

  const handleNav = (path: string) => {
    setMobileMenuOpen(false)
    onNavigate(path)
  }

  return (
    <header className="header-wrapper">
      <div className="header-inner">
        {/* Brand */}
        <a
          href="/"
          className="brand-link"
          onClick={(e) => {
            e.preventDefault()
            handleNav('/')
          }}
        >
          <div className="brand-logo-icon">
            <Wrench size={18} />
          </div>
          <span className="brand-name">MicroTools</span>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="nav-desktop">
          <a
            href="/tools"
            className={`nav-link ${currentPath === '/tools' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              handleNav('/tools')
            }}
          >
            Tools
          </a>
          <a
            href="/categories"
            className={`nav-link ${currentPath === '/categories' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              handleNav('/categories')
            }}
          >
            Categories
          </a>
          <a
            href="/about"
            className={`nav-link ${currentPath === '/about' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              handleNav('/about')
            }}
          >
            Privacy & About
          </a>

          {/* Theme Toggle */}
          <button
            type="button"
            className="btn-theme-toggle"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </nav>

        {/* Mobile Actions */}
        <div className="nav-mobile-actions">
          <button
            type="button"
            className="btn-theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            type="button"
            className="btn-mobile-menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="nav-mobile-dropdown">
          <a
            href="/tools"
            className={`nav-mobile-link ${currentPath === '/tools' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              handleNav('/tools')
            }}
          >
            Tools
          </a>
          <a
            href="/categories"
            className={`nav-mobile-link ${currentPath === '/categories' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              handleNav('/categories')
            }}
          >
            Categories
          </a>
          <a
            href="/about"
            className={`nav-mobile-link ${currentPath === '/about' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              handleNav('/about')
            }}
          >
            Privacy & About
          </a>
        </div>
      )}
    </header>
  )
}
