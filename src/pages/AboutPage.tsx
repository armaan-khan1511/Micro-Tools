import React from 'react'
import { ShieldCheck, HardDrive, CheckCircle2, ArrowLeft } from 'lucide-react'

interface AboutPageProps {
  onBack: () => void
}

export const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <button
          type="button"
          className="tool-back-link"
          onClick={onBack}
          style={{ marginBottom: '1rem' }}
        >
          <ArrowLeft size={16} /> Back to Tools
        </button>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.75rem' }}>
          Privacy, Performance & Technical Boundaries
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          MicroTools is designed from first principles as a 100% client-side platform. Understanding how it runs
          helps you get the highest speed and reliability while preserving complete data confidentiality.
        </p>
      </div>

      {/* Zero Upload Guarantee */}
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald)' }}>
            <ShieldCheck size={22} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Zero Server Upload Guarantee</h2>
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Unlike standard cloud converter services that upload your confidential PDFs, photos, and archives to third-party
          servers, every calculation in MicroTools executes strictly inside your web browser's JavaScript V8/SpiderMonkey engine.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <CheckCircle2 size={16} color="var(--accent-emerald)" /> Zero bytes of your files are transmitted to Vercel or any remote API.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <CheckCircle2 size={16} color="var(--accent-emerald)" /> No cookies, telemetry trackers, or file retention databases exist.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <CheckCircle2 size={16} color="var(--accent-emerald)" /> Works completely offline once initial static bundles are cached.
          </div>
        </div>
      </section>

      {/* Browser and System Limitations */}
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-amber)' }}>
            <HardDrive size={22} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Browser & Memory Limits (Rule 14 Disclosure)</h2>
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Because operations execute inside the client device, processing capability is bounded by your machine's hardware
          and browser tab constraints:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              Tab Memory (~2GB - 4GB)
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Web browsers allocate a maximum heap per tab. Files exceeding 200MB (especially 4K video or massive multi-thousand-page PDFs) may cause tab restarts.
            </div>
          </div>

          <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              CPU & Concurrency
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Processing speed directly mirrors your local CPU cores. To prevent UI freezing, long-running cryptographic hashing and compression tasks use Web Workers.
            </div>
          </div>

          <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              Vercel Bandwidth
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Vercel only delivers the static HTML/JS/CSS assets (under 500 KB total). Zero bandwidth is consumed on file transfers, ensuring sustainability at scale.
            </div>
          </div>
        </div>
      </section>

      {/* Open Source Libraries & Audited Licenses */}
      <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Audited Open-Source Libraries</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          All core processing libraries have been verified for permissive commercial and open-source usage:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
          {[
            { name: 'pdf-lib', license: 'MIT', purpose: 'PDF document creation, merging, splitting, and security' },
            { name: 'jszip', license: 'MIT', purpose: 'Client-side ZIP packaging, folder structures, and extraction' },
            { name: 'qrcode', license: 'MIT', purpose: 'Vector and raster QR code rendering' },
            { name: 'html5-qrcode', license: 'Apache-2.0', purpose: 'Camera and image barcode/QR decode engine' },
            { name: 'marked', license: 'MIT', purpose: 'High-speed Markdown compiler' },
            { name: 'dompurify', license: 'Apache-2.0 / MPL-2.0', purpose: 'HTML sanitization against XSS vulnerabilities' },
            { name: 'diff', license: 'BSD-3-Clause', purpose: 'Text diff and comparison algorithms' },
            { name: 'lucide-react', license: 'MIT', purpose: 'Clean, accessible vector icon toolkit' },
          ].map((lib) => (
            <div
              key={lib.name}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {lib.name}
                </span>
                <span style={{ color: 'var(--text-muted)', marginLeft: '0.75rem', fontSize: '0.8rem' }}>
                  {lib.purpose}
                </span>
              </div>
              <span className="badge" style={{ fontSize: '0.7rem' }}>
                {lib.license}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
