import React, { useState, useEffect } from 'react'
import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'
import { HomePage } from './pages/HomePage'
import { AboutPage } from './pages/AboutPage'
import { ToolDetailPage } from './pages/ToolDetailPage'
import { ToolViewRouter } from './tools/ToolViewRouter'
import { TOOLS } from './data/toolsRegistry'
import './styles/global.css'

export function App() {
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname || '/')

  // Listen to browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Navigation function
  const navigate = (path: string) => {
    window.history.pushState({}, '', path)
    setCurrentPath(path)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Determine active view
  let activeContent: React.ReactNode = null

  if (currentPath === '/' || currentPath === '') {
    activeContent = <HomePage onSelectTool={(toolId) => navigate(`/tool/${toolId}`)} />
  } else if (currentPath === '/about') {
    activeContent = <AboutPage onBack={() => navigate('/')} />
  } else if (currentPath.startsWith('/tool/')) {
    const toolId = currentPath.replace('/tool/', '').split('/')[0]
    const tool = TOOLS.find((t) => t.id === toolId)

    if (tool) {
      activeContent = (
        <ToolDetailPage tool={tool} onBack={() => navigate('/')}>
          <ToolViewRouter toolId={tool.id} />
        </ToolDetailPage>
      )
    } else {
      activeContent = (
        <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Tool Not Found</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            The requested tool does not exist or has been relocated.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/')}>
            Back to Catalog
          </button>
        </div>
      )
    }
  } else {
    activeContent = (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>404 — Page Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          The requested address is not part of MicroTools.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/')}>
          Return Home
        </button>
      </div>
    )
  }

  return (
    <div className="app-container">
      <Header currentPath={currentPath} onNavigate={navigate} />
      <main className="main-content">{activeContent}</main>
      <Footer onNavigate={navigate} />
    </div>
  )
}

export default App
