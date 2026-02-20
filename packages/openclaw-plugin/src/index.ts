const DEFAULT_SERVER_URL = 'http://localhost:3001'

interface OpenClawAPI {
  registerGatewayMethod: (name: string, handler: (params: Record<string, unknown>) => Promise<unknown>) => void
  config?: {
    get: (key: string) => unknown
  }
}

export default function slideclawPlugin(api: OpenClawAPI) {
  function getServerUrl(): string {
    const url = api.config?.get('slideclaw.serverUrl')
    return typeof url === 'string' ? url : DEFAULT_SERVER_URL
  }

  async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const serverUrl = getServerUrl()
    const res = await fetch(`${serverUrl}/api${path}`, {
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      ...options,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error((err as { error: string }).error ?? res.statusText)
    }
    return res.json()
  }

  // Generate a presentation from a prompt
  api.registerGatewayMethod('slideclaw.generate', async (params) => {
    const { prompt, presentationId } = params as { prompt: string; presentationId?: string }
    return request('/agent/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt, presentationId }),
    })
  })

  // List all presentations
  api.registerGatewayMethod('slideclaw.listPresentations', async () => {
    return request('/presentations')
  })

  // Get a presentation by ID
  api.registerGatewayMethod('slideclaw.getPresentation', async (params) => {
    const { id } = params as { id: string }
    return request(`/presentations/${id}`)
  })

  // Create a presentation
  api.registerGatewayMethod('slideclaw.createPresentation', async (params) => {
    const { title, description } = params as { title: string; description?: string }
    return request('/presentations', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    })
  })

  // Delete a presentation
  api.registerGatewayMethod('slideclaw.deletePresentation', async (params) => {
    const { id } = params as { id: string }
    return request(`/presentations/${id}`, { method: 'DELETE' })
  })

  // Get export URL for PDF
  api.registerGatewayMethod('slideclaw.exportPdf', async (params) => {
    const { id } = params as { id: string }
    const serverUrl = getServerUrl()
    return { url: `${serverUrl}/api/presentations/${id}/export/pdf` }
  })

  // Get export URL for PPTX
  api.registerGatewayMethod('slideclaw.exportPptx', async (params) => {
    const { id } = params as { id: string }
    const serverUrl = getServerUrl()
    return { url: `${serverUrl}/api/presentations/${id}/export/pptx` }
  })

  // Add a slide to a presentation
  api.registerGatewayMethod('slideclaw.addSlide', async (params) => {
    const { presentationId, title, html, notes } = params as {
      presentationId: string
      title: string
      html: string
      notes?: string
    }
    return request(`/presentations/${presentationId}/slides`, {
      method: 'POST',
      body: JSON.stringify({ title, html, notes }),
    })
  })

  // Update a slide
  api.registerGatewayMethod('slideclaw.updateSlide', async (params) => {
    const { presentationId, slideId, ...updates } = params as {
      presentationId: string
      slideId: string
      title?: string
      html?: string
      notes?: string
    }
    return request(`/presentations/${presentationId}/slides/${slideId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  })

  // Delete a slide
  api.registerGatewayMethod('slideclaw.deleteSlide', async (params) => {
    const { presentationId, slideId } = params as { presentationId: string; slideId: string }
    return request(`/presentations/${presentationId}/slides/${slideId}`, { method: 'DELETE' })
  })

  // Reorder slides
  api.registerGatewayMethod('slideclaw.reorderSlides', async (params) => {
    const { presentationId, slideIds } = params as { presentationId: string; slideIds: string[] }
    return request(`/presentations/${presentationId}/slides/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ slideIds }),
    })
  })

  // Get the current design config and available library catalog
  api.registerGatewayMethod('slideclaw.getDesignConfig', async () => {
    return request('/design-config')
  })

  // Set the preferred CSS library for slide generation
  api.registerGatewayMethod('slideclaw.setDesignConfig', async (params) => {
    const { library } = params as { library: string }
    return request('/design-config', {
      method: 'PUT',
      body: JSON.stringify({ library }),
    })
  })
}
