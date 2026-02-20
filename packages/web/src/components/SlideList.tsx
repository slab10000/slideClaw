import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Slide } from '../types'

interface SortableSlideItemProps {
  slide: Slide
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
}

function SortableSlideItem({ slide, isSelected, onSelect, onDelete }: SortableSlideItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slide.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`slide-item ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="slide-drag-handle" {...attributes} {...listeners}>
        ⠿
      </div>
      <div className="slide-thumbnail">
        <iframe
          srcDoc={slide.html}
          title={slide.title}
          sandbox="allow-scripts"
          className="slide-thumb-iframe"
        />
      </div>
      <div className="slide-item-info">
        <span className="slide-item-order">{slide.order + 1}</span>
        <span className="slide-item-title">{slide.title}</span>
      </div>
      <button
        className="slide-delete-btn"
        onClick={e => {
          e.stopPropagation()
          onDelete()
        }}
        title="Delete slide"
      >
        ×
      </button>
    </div>
  )
}

interface SlideListProps {
  slides: Slide[]
  selectedSlideId: string | null
  onSelect: (slideId: string) => void
  onDelete: (slideId: string) => void
  onReorder: (slideIds: string[]) => void
}

export function SlideList({ slides, selectedSlideId, onSelect, onDelete, onReorder }: SlideListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const sortedSlides = [...slides].sort((a, b) => a.order - b.order)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sortedSlides.findIndex(s => s.id === active.id)
    const newIndex = sortedSlides.findIndex(s => s.id === over.id)

    const newOrder = [...sortedSlides]
    const [moved] = newOrder.splice(oldIndex, 1)
    newOrder.splice(newIndex, 0, moved)
    onReorder(newOrder.map(s => s.id))
  }

  return (
    <div className="slide-list">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortedSlides.map(s => s.id)} strategy={verticalListSortingStrategy}>
          {sortedSlides.map(slide => (
            <SortableSlideItem
              key={slide.id}
              slide={slide}
              isSelected={slide.id === selectedSlideId}
              onSelect={() => onSelect(slide.id)}
              onDelete={() => onDelete(slide.id)}
            />
          ))}
        </SortableContext>
      </DndContext>
      {slides.length === 0 && (
        <div className="slide-list-empty">No slides yet. Use the prompt below to generate some!</div>
      )}
    </div>
  )
}
