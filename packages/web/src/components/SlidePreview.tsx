import { useRef, useEffect, useState } from 'react'
import type { Slide } from '../types'

interface SlidePreviewProps {
  slide: Slide | null
}

const SLIDE_WIDTH = 1280
const SLIDE_HEIGHT = 720

export function SlidePreview({ slide }: SlidePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    function updateScale() {
      if (!containerRef.current) return
      const { width, height } = containerRef.current.getBoundingClientRect()
      const scaleX = width / SLIDE_WIDTH
      const scaleY = height / SLIDE_HEIGHT
      setScale(Math.min(scaleX, scaleY))
    }

    updateScale()
    const observer = new ResizeObserver(updateScale)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  if (!slide) {
    return (
      <div className="slide-preview-empty">
        <p>Select a slide to preview</p>
      </div>
    )
  }

  return (
    <div className="slide-preview-container" ref={containerRef}>
      <div
        className="slide-preview-wrapper"
        style={{
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <iframe
          key={slide.id + slide.updatedAt}
          srcDoc={slide.html}
          title={slide.title}
          sandbox="allow-scripts"
          style={{ width: SLIDE_WIDTH, height: SLIDE_HEIGHT, border: 'none' }}
        />
      </div>
    </div>
  )
}
