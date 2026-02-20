import type { Presentation, PresentationSummary, Slide } from './types'

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? res.statusText)
  }
  return res.json()
}

export const api = {
  listPresentations: () => request<PresentationSummary[]>('/presentations'),
  getPresentation: (id: string) => request<Presentation>(`/presentations/${id}`),
  createPresentation: (title: string, description?: string) =>
    request<Presentation>('/presentations', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    }),
  deletePresentation: (id: string) => request<{ success: boolean }>(`/presentations/${id}`, { method: 'DELETE' }),

  addSlide: (presentationId: string, data: { title: string; html: string; notes?: string }) =>
    request<Slide>(`/presentations/${presentationId}/slides`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSlide: (presentationId: string, slideId: string, data: { title?: string; html?: string; notes?: string }) =>
    request<Slide>(`/presentations/${presentationId}/slides/${slideId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteSlide: (presentationId: string, slideId: string) =>
    request<{ success: boolean }>(`/presentations/${presentationId}/slides/${slideId}`, { method: 'DELETE' }),
  reorderSlides: (presentationId: string, slideIds: string[]) =>
    request<Presentation>(`/presentations/${presentationId}/slides/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ slideIds }),
    }),

  generate: (prompt: string, presentationId?: string) =>
    request<{ presentationId: string | null; message: string }>('/agent/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt, presentationId }),
    }),

  exportPdfUrl: (id: string) => `${BASE}/presentations/${id}/export/pdf`,
  exportPptxUrl: (id: string) => `${BASE}/presentations/${id}/export/pptx`,
}
