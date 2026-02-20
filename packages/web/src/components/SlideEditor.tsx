import { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import type { Slide } from '../types'

interface SlideEditorProps {
  slide: Slide | null
  onApply: (html: string) => void
}

export function SlideEditor({ slide, onApply }: SlideEditorProps) {
  const [value, setValue] = useState('')

  useEffect(() => {
    setValue(slide?.html ?? '')
  }, [slide?.id])

  if (!slide) {
    return (
      <div className="slide-editor-empty">
        <p>Select a slide to edit its HTML</p>
      </div>
    )
  }

  return (
    <div className="slide-editor">
      <div className="slide-editor-monaco">
        <Editor
          height="100%"
          defaultLanguage="html"
          value={value}
          onChange={v => setValue(v ?? '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
          }}
        />
      </div>
      <div className="slide-editor-footer">
        <button
          className="btn btn-primary"
          onClick={() => onApply(value)}
          disabled={value === slide.html}
        >
          Apply
        </button>
      </div>
    </div>
  )
}
