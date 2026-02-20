import { useState, useEffect, useRef } from 'react'

interface Props {
  onConfirm: (title: string, description: string) => void
  onClose: () => void
}

export function NewPresentationModal({ onConfirm, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [visible, setVisible] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Trigger enter animation on mount
    requestAnimationFrame(() => setVisible(true))
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 200)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    onConfirm(trimmed, description.trim())
  }

  return (
    <div
      className={`modal-backdrop ${visible ? 'modal-visible' : ''}`}
      onClick={e => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div className={`modal-window ${visible ? 'modal-visible' : ''}`}>
        <div className="modal-header">
          <div className="modal-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <h2 className="modal-title">New Presentation</h2>
          <button className="modal-close-btn" onClick={handleClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="modal-field">
            <label className="modal-label" htmlFor="pres-title">Title <span className="modal-required">*</span></label>
            <input
              id="pres-title"
              ref={inputRef}
              className="modal-input"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Q4 Business Review"
              maxLength={120}
              autoComplete="off"
            />
          </div>

          <div className="modal-field">
            <label className="modal-label" htmlFor="pres-desc">
              Description <span className="modal-optional">(optional)</span>
            </label>
            <textarea
              id="pres-desc"
              className="modal-textarea"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description of your presentation…"
              rows={3}
              maxLength={400}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!title.trim()}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
