import type { FastifyInstance } from 'fastify'
import { getDesignConfig, saveDesignConfig } from '@slideclaw/core'
import type { DesignLibrary } from '@slideclaw/core'
import { LIBRARY_CATALOG } from '../design-catalog.js'

export async function designRoutes(fastify: FastifyInstance) {
  fastify.get('/design-config', async () => {
    const config = await getDesignConfig()
    return { config, catalog: LIBRARY_CATALOG }
  })

  fastify.put<{ Body: { library: DesignLibrary } }>('/design-config', async (request, reply) => {
    const { library } = request.body
    const validKeys = LIBRARY_CATALOG.map(l => l.key)
    if (!validKeys.includes(library)) {
      return reply.code(400).send({ error: `Invalid library. Valid values: ${validKeys.join(', ')}` })
    }
    const config = await saveDesignConfig({ library })
    return config
  })
}
