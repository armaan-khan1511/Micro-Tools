import React from 'react'
import { ShieldCheck } from 'lucide-react'

interface FooterProps {
  onNavigate: (path: string) => void
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="footer-wrapper">
      <div className="footer-inner">
        <div className="footer-content">
          <div className="footer-brand-info">
            <span className="footer-logo-text">MicroTools</span>
            <span className="footer-tagline">
              Clean online toolbox with 100% private in-browser processing.
            </span>
          </div>

          <nav className="footer-links">
            <a
              href="/tools"
              onClick={(e) => {
                e.preventDefault()
                onNavigate('/tools')
              }}
            >
              All Tools
            </a>
            <a
              href="/categories"
              onClick={(e) => {
                e.preventDefault()
                onNavigate('/categories')
              }}
            >
              Categories
            </a>
            <a
              href="/about"
              onClick={(e) => {
                e.preventDefault()
                onNavigate('/about')
              }}
            >
              Privacy & Specs
            </a>
          </nav>
        </div>

        <div className="footer-bottom-bar">
          <div className="footer-privacy-pill">
            <ShieldCheck size={14} />
            <span>Zero server file uploads — everything runs locally in your browser</span>
          </div>
          <div className="footer-copyright">
            © {new Date().getFullYear()} MicroTools.
          </div>
        </div>
      </div>
    </footer>
  )
}
