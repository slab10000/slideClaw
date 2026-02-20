import Fastify from 'fastify'
import cors from '@fastify/cors'
import { presentationRoutes } from './routes/presentations.js'
import { agentRoutes } from './routes/agent.js'
import { exportRoutes } from './routes/exports.js'
import { designRoutes } from './routes/design.js'

export async function createServer(port = 3001) {
  const fastify = Fastify({ logger: true })

  await fastify.register(cors, {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  })

  fastify.register(presentationRoutes, { prefix: '/api' })
  fastify.register(agentRoutes, { prefix: '/api' })
  fastify.register(exportRoutes, { prefix: '/api' })
  fastify.register(designRoutes, { prefix: '/api' })

  fastify.get('/health', async () => ({ status: 'ok' }))

  return fastify
}

async function main() {
  const port = parseInt(process.env.PORT ?? '3001', 10)
  const server = await createServer(port)
  try {
    await server.listen({ port, host: '0.0.0.0' })
    console.log(`slideClaw server running at http://localhost:${port}`)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

main()
