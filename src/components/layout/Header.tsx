import React, { useState, useEffect } from 'react'
import { Sun, Moon, ShieldCheck, Layers } from 'lucide-react'

interface HeaderProps {
  currentPath: string
  onNavigate: (path: string) => void
}

export const Header: React.FC<HeaderProps> = ({ currentPath, onNavigate }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

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
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('microtools-theme', newTheme)
  }

  return (
    <header className="header-wrapper">
      <div className="header-inner">
        <a
          href="/"
          className="brand-link"
          onClick={(e) => {
            e.preventDefault()
            onNavigate('/')
          }}
        >
          <div className="brand-logo-icon">
            <Layers size={18} />
          </div>
          <span>MicroTools</span>
          <span className="badge badge-green" style={{ marginLeft: '0.25rem', fontSize: '0.68rem' }}>
            <ShieldCheck size={11} /> 100% In-Browser
          </span>
        </a>

        <nav className="nav-links">
          <a
            href="/"
            className={`nav-link ${currentPath === '/' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              onNavigate('/')
            }}
          >
            All Tools
          </a>
          <a
            href="/about"
            className={`nav-link ${currentPath === '/about' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault()
              onNavigate('/about')
            }}
          >
            Privacy & Specs
          </a>
          <button
            className="btn-icon"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </nav>
      </div>
    </header>
  )
}
