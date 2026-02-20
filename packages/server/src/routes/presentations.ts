import type { FastifyInstance } from 'fastify'
import {
  listPresentations,
  getPresentation,
  savePresentation,
  deletePresentation,
  createId,
  now,
  type Slide,
} from '@slideclaw/core'

export async function presentationRoutes(fastify: FastifyInstance) {
  // GET /api/presentations
  fastify.get('/presentations', async () => {
    const presentations = await listPresentations()
    return presentations.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      slideCount: p.slides.length,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }))
  })

  // POST /api/presentations
  fastify.post<{ Body: { title: string; description?: string } }>('/presentations', async (request, reply) => {
    const { title, description } = request.body
    if (!title) return reply.code(400).send({ error: 'title is required' })

    const presentation = {
      id: createId(),
      title,
      description,
      slides: [],
      createdAt: now(),
      updatedAt: now(),
    }
    await savePresentation(presentation)
    return reply.code(201).send(presentation)
  })

  // GET /api/presentations/:id
  fastify.get<{ Params: { id: string } }>('/presentations/:id', async (request, reply) => {
    const presentation = await getPresentation(request.params.id)
    if (!presentation) return reply.code(404).send({ error: 'Presentation not found' })
    return presentation
  })

  // DELETE /api/presentations/:id
  fastify.delete<{ Params: { id: string } }>('/presentations/:id', async (request, reply) => {
    const deleted = await deletePresentation(request.params.id)
    if (!deleted) return reply.code(404).send({ error: 'Presentation not found' })
    return { success: true }
  })

  // POST /api/presentations/:id/slides
  fastify.post<{
    Params: { id: string }
    Body: { title: string; html: string; notes?: string }
  }>('/presentations/:id/slides', async (request, reply) => {
    const presentation = await getPresentation(request.params.id)
    if (!presentation) return reply.code(404).send({ error: 'Presentation not found' })

    const { title, html, notes } = request.body
    if (!title || !html) return reply.code(400).send({ error: 'title and html are required' })

    const slide: Slide = {
      id: createId(),
      title,
      html,
      notes,
      order: presentation.slides.length,
      createdAt: now(),
      updatedAt: now(),
    }
    presentation.slides.push(slide)
    presentation.updatedAt = now()
    await savePresentation(presentation)
    return reply.code(201).send(slide)
  })

  // PUT /api/presentations/:id/slides/:slideId
  fastify.put<{
    Params: { id: string; slideId: string }
    Body: { title?: string; html?: string; notes?: string }
  }>('/presentations/:id/slides/:slideId', async (request, reply) => {
    const presentation = await getPresentation(request.params.id)
    if (!presentation) return reply.code(404).send({ error: 'Presentation not found' })

    const slide = presentation.slides.find(s => s.id === request.params.slideId)
    if (!slide) return reply.code(404).send({ error: 'Slide not found' })

    const { title, html, notes } = request.body
    if (title !== undefined) slide.title = title
    if (html !== undefined) slide.html = html
    if (notes !== undefined) slide.notes = notes
    slide.updatedAt = now()
    presentation.updatedAt = now()

    await savePresentation(presentation)
    return slide
  })

  // DELETE /api/presentations/:id/slides/:slideId
  fastify.delete<{
    Params: { id: string; slideId: string }
  }>('/presentations/:id/slides/:slideId', async (request, reply) => {
    const presentation = await getPresentation(request.params.id)
    if (!presentation) return reply.code(404).send({ error: 'Presentation not found' })

    const slideIndex = presentation.slides.findIndex(s => s.id === request.params.slideId)
    if (slideIndex === -1) return reply.code(404).send({ error: 'Slide not found' })

    presentation.slides.splice(slideIndex, 1)
    presentation.slides.forEach((s, i) => { s.order = i })
    presentation.updatedAt = now()
    await savePresentation(presentation)
    return { success: true }
  })

  // PUT /api/presentations/:id/slides/reorder
  fastify.put<{
    Params: { id: string }
    Body: { slideIds: string[] }
  }>('/presentations/:id/slides/reorder', async (request, reply) => {
    const presentation = await getPresentation(request.params.id)
    if (!presentation) return reply.code(404).send({ error: 'Presentation not found' })

    const { slideIds } = request.body
    if (!Array.isArray(slideIds)) return reply.code(400).send({ error: 'slideIds must be an array' })

    const slideMap = new Map(presentation.slides.map(s => [s.id, s]))
    presentation.slides = slideIds.map((id, i) => {
      const slide = slideMap.get(id)
      if (!slide) throw new Error(`Slide ${id} not found`)
      slide.order = i
      return slide
    })
    presentation.updatedAt = now()
    await savePresentation(presentation)
    return presentation
  })
}
