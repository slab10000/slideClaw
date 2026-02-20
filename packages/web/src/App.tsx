import { useState, useEffect, useCallback } from 'react'
import { api } from './api'
import type { Presentation, PresentationSummary } from './types'
import { SlideList } from './components/SlideList'
import { SlidePreview } from './components/SlidePreview'
import { GenerateBar } from './components/GenerateBar'
import { PresentationList } from './components/PresentationList'
import { NewPresentationModal } from './components/NewPresentationModal'
import './App.css'

export default function App() {
  const [presentations, setPresentations] = useState<PresentationSummary[]>([])
  const [currentPresentation, setCurrentPresentation] = useState<Presentation | null>(null)
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPresentationList, setShowPresentationList] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)

  const selectedSlide = currentPresentation?.slides.find(s => s.id === selectedSlideId) ?? null

  const loadPresentations = useCallback(async () => {
    try {
      const list = await api.listPresentations()
      setPresentations(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load presentations')
    }
  }, [])

  const loadPresentation = useCallback(async (id: string) => {
    try {
      const p = await api.getPresentation(id)
      setCurrentPresentation(p)
      const sorted = [...p.slides].sort((a, b) => a.order - b.order)
      setSelectedSlideId(sorted[0]?.id ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load presentation')
    }
  }, [])

  useEffect(() => {
    loadPresentations()
  }, [loadPresentations])

  async function handleGenerate(prompt: string) {
    setIsGenerating(true)
    setError(null)
    try {
      const result = await api.generate(prompt, currentPresentation?.id)
      if (result.presentationId) {
        await loadPresentation(result.presentationId)
        await loadPresentations()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleCreatePresentation(title: string, description: string) {
    setShowNewModal(false)
    try {
      const p = await api.createPresentation(title, description || undefined)
      await loadPresentations()
      await loadPresentation(p.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create presentation')
    }
  }

  async function handleDeletePresentation(id: string) {
    try {
      await api.deletePresentation(id)
      if (currentPresentation?.id === id) {
        setCurrentPresentation(null)
        setSelectedSlideId(null)
      }
      await loadPresentations()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete presentation')
    }
  }

  async function handleDeleteSlide(slideId: string) {
    if (!currentPresentation) return
    try {
      await api.deleteSlide(currentPresentation.id, slideId)
      await loadPresentation(currentPresentation.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete slide')
    }
  }

  async function handleReorderSlides(slideIds: string[]) {
    if (!currentPresentation) return
    try {
      const updated = await api.reorderSlides(currentPresentation.id, slideIds)
      setCurrentPresentation(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reorder slides')
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <button
            className="logo-btn"
            onClick={() => setShowPresentationList(!showPresentationList)}
            title="Toggle presentation list"
          >
            <span className="logo">slideClaw</span>
          </button>
          {currentPresentation && (
            <span className="presentation-title">{currentPresentation.title}</span>
          )}
        </div>
        <div className="header-right">
          {currentPresentation && (
            <>
              <a
                href={api.exportPdfUrl(currentPresentation.id)}
                className="btn btn-secondary"
                download
              >
                Export PDF
              </a>
              <a
                href={api.exportPptxUrl(currentPresentation.id)}
                className="btn btn-secondary"
                download
              >
                Export PPTX
              </a>
            </>
          )}
        </div>
      </header>

      {showPresentationList && (
        <div className="presentation-panel">
          <PresentationList
            presentations={presentations}
            selectedId={currentPresentation?.id ?? null}
            onSelect={id => { loadPresentation(id); setShowPresentationList(false) }}
            onCreate={() => setShowNewModal(true)}
            onDelete={handleDeletePresentation}
          />
        </div>
      )}

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <main className="app-main">
        {currentPresentation ? (
          <>
            <aside className="slide-sidebar">
              <SlideList
                slides={currentPresentation.slides}
                selectedSlideId={selectedSlideId}
                onSelect={setSelectedSlideId}
                onDelete={handleDeleteSlide}
                onReorder={handleReorderSlides}
              />
            </aside>
            <div className="slide-content">
              <SlidePreview slide={selectedSlide} />
            </div>
          </>
        ) : (
          <div className="app-welcome">
            <h2>Welcome to slideClaw</h2>
            <p>Create AI-powered presentations where every slide is a full HTML document.</p>
            <div className="welcome-actions">
              <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
                Create Presentation
              </button>
              {presentations.length > 0 && (
                <button className="btn btn-secondary" onClick={() => setShowPresentationList(true)}>
                  Open Existing ({presentations.length})
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <GenerateBar
          presentationId={currentPresentation?.id ?? null}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />
      </footer>

      {showNewModal && (
        <NewPresentationModal
          onConfirm={handleCreatePresentation}
          onClose={() => setShowNewModal(false)}
        />
      )}
    </div>
  )
}
