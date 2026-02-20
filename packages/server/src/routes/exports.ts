import type { FastifyInstance } from 'fastify'
import { exportToPdf } from '../export/pdf.js'
import { exportToPptx } from '../export/pptx.js'

export async function exportRoutes(fastify: FastifyInstance) {
  fastify.get<{ Params: { id: string } }>('/presentations/:id/export/pdf', async (request, reply) => {
    try {
      const pdfBuffer = await exportToPdf(request.params.id)
      reply.header('Content-Type', 'application/pdf')
      reply.header('Content-Disposition', `attachment; filename="presentation-${request.params.id}.pdf"`)
      return reply.send(pdfBuffer)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export error'
      return reply.code(500).send({ error: message })
    }
  })

  fastify.get<{ Params: { id: string } }>('/presentations/:id/export/pptx', async (request, reply) => {
    try {
      const pptxBuffer = await exportToPptx(request.params.id)
      reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation')
      reply.header('Content-Disposition', `attachment; filename="presentation-${request.params.id}.pptx"`)
      return reply.send(pptxBuffer)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export error'
      return reply.code(500).send({ error: message })
    }
  })
}
