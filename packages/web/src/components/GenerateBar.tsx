import { useState } from 'react'

interface GenerateBarProps {
  presentationId: string | null
  onGenerate: (prompt: string) => Promise<void>
  isGenerating: boolean
}

export function GenerateBar({ presentationId: _presentationId, onGenerate, isGenerating }: GenerateBarProps) {
  const [prompt, setPrompt] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!prompt.trim() || isGenerating) return
    await onGenerate(prompt.trim())
    setPrompt('')
  }

  return (
    <form className="generate-bar" onSubmit={handleSubmit}>
      <input
        type="text"
        className="generate-input"
        placeholder="Describe your presentation… e.g. 'Create a 5-slide deck about the solar system'"
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        disabled={isGenerating}
      />
      <button type="submit" className="btn btn-primary generate-btn" disabled={isGenerating || !prompt.trim()}>
        {isGenerating ? (
          <>
            <span className="spinner" /> Generating…
          </>
        ) : (
          <>✨ Generate</>
        )}
      </button>
    </form>
  )
}
