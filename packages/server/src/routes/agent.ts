import type { FastifyInstance } from 'fastify'
import { runAgent } from '../agent/index.js'

export async function agentRoutes(fastify: FastifyInstance) {
  fastify.post<{
    Body: { prompt: string; presentationId?: string }
  }>('/agent/generate', async (request, reply) => {
    const { prompt, presentationId } = request.body
    if (!prompt) return reply.code(400).send({ error: 'prompt is required' })

    try {
      const result = await runAgent(prompt, presentationId)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Agent error'
      return reply.code(500).send({ error: message })
    }
  })
}
