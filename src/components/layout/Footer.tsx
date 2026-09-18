import React from 'react'
import { ShieldCheck, Cpu, CloudOff } from 'lucide-react'

interface FooterProps {
  onNavigate: (path: string) => void
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="footer-wrapper">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand-col">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              MicroTools Platform
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              A privacy-first suite of 40 client-side utilities. All file operations, conversions, compressions,
              and rendering happen locally in your browser memory.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Architecture
              </h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CloudOff size={14} color="var(--accent-emerald)" /> Zero Server Uploads
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldCheck size={14} color="var(--accent-emerald)" /> Web Crypto / Canvas
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Cpu size={14} color="var(--accent-primary)" /> Client-Side Web Workers
                </li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Legal & Limits
              </h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                <li>
                  <a
                    href="/about"
                    onClick={(e) => {
                      e.preventDefault()
                      onNavigate('/about')
                    }}
                    style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}
                  >
                    Browser & Memory Limits
                  </a>
                </li>
                <li style={{ color: 'var(--text-muted)' }}>
                  MIT / Apache 2.0 Open Source
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div>
            © {new Date().getFullYear()} MicroTools. Fast, static, client-side first.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span>Deployed statically on Vercel</span>
            <span>•</span>
            <a
              href="/about"
              onClick={(e) => {
                e.preventDefault()
                onNavigate('/about')
              }}
              style={{ color: 'var(--text-secondary)' }}
            >
              System Specifications
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
