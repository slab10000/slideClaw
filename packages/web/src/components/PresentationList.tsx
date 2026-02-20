import type { PresentationSummary } from '../types'

interface PresentationListProps {
  presentations: PresentationSummary[]
  selectedId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
  onDelete: (id: string) => void
}

export function PresentationList({ presentations, selectedId, onSelect, onCreate, onDelete }: PresentationListProps) {
  return (
    <div className="presentation-list">
      <div className="presentation-list-header">
        <h3>Presentations</h3>
        <button className="btn btn-sm btn-secondary" onClick={onCreate}>+ New</button>
      </div>
      <div className="presentation-list-items">
        {presentations.map(p => (
          <div
            key={p.id}
            className={`presentation-item ${p.id === selectedId ? 'selected' : ''}`}
            onClick={() => onSelect(p.id)}
          >
            <div className="presentation-item-info">
              <span className="presentation-item-title">{p.title}</span>
              <span className="presentation-item-meta">{p.slideCount} slides</span>
            </div>
            <button
              className="presentation-delete-btn"
              onClick={e => {
                e.stopPropagation()
                if (confirm(`Delete "${p.title}"?`)) onDelete(p.id)
              }}
              title="Delete presentation"
            >
              ×
            </button>
          </div>
        ))}
        {presentations.length === 0 && (
          <div className="presentation-list-empty">No presentations yet</div>
        )}
      </div>
    </div>
  )
}
