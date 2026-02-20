import { GoogleGenerativeAI, type FunctionDeclaration, SchemaType } from '@google/generative-ai'
import {
  listPresentations,
  getPresentation,
  savePresentation,
  deletePresentation,
  createId,
  now,
  getDesignConfig,
  type Presentation,
  type Slide,
} from '@slideclaw/core'
import { LIBRARY_CATALOG } from '../design-catalog.js'

const SYSTEM_PROMPT = `You are an AI presentation designer for slideClaw.

Your job is to create and manage beautiful, accessible HTML slide presentations. Each slide is a COMPLETE, SELF-CONTAINED HTML document.

Rules for generating slides:
1. Each slide MUST be a complete HTML document with <html>, <head>, and <body> tags
2. Slides are rendered at exactly 1280×720px (16:9 aspect ratio)
3. Set <html> and <body> styles to: margin: 0; padding: 0; width: 1280px; height: 720px; overflow: hidden;
4. Call get_design_config before generating slides to get the available CSS libraries and the user's preference. Use the library specified (or choose the best fit if set to 'auto').
5. You may ALWAYS additionally include: Chart.js (https://cdn.jsdelivr.net/npm/chart.js), Three.js (https://cdn.jsdelivr.net/npm/three), anime.js (https://cdn.jsdelivr.net/npm/animejs) for data and animation.
6. Inline ALL styles — no external local file imports
7. Use CSS animations and transitions freely to make slides visually engaging
8. Make slides visually stunning with rich colors, gradients, and modern design
9. Each slide should look like a professional presentation slide

Accessibility — make slides usable for everyone:
- Use semantic HTML elements: <h1>, <h2>, <p>, <ul>, <ol>, <figure>, <figcaption>, <section>, <article>
- Ensure text has sufficient contrast against its background (WCAG AA: 4.5:1 for normal text)
- Add alt attributes to all <img> elements
- Do not rely on color alone to convey meaning — use text labels or patterns too
- Prefer readable font sizes (minimum 18px for body text in slides)

When asked to create a presentation:
1. Call get_design_config to check the preferred library
2. Call create_presentation to create it
3. Call add_slide for each slide, using the chosen library's CDN tag in <head>
4. After generating ALL slides, call finish() to signal completion

When editing existing presentations, use update_slide, delete_slide, or reorder_slides as needed, then call finish().`

const tools: FunctionDeclaration[] = [
  {
    name: 'create_presentation',
    description: 'Create a new presentation',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING, description: 'Title of the presentation' },
        description: { type: SchemaType.STRING, description: 'Optional description' },
      },
      required: ['title'],
    },
  },
  {
    name: 'add_slide',
    description: 'Add a new slide to a presentation',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        presentationId: { type: SchemaType.STRING, description: 'ID of the presentation' },
        title: { type: SchemaType.STRING, description: 'Title of the slide' },
        html: { type: SchemaType.STRING, description: 'Complete standalone HTML document for the slide' },
        notes: { type: SchemaType.STRING, description: 'Optional speaker notes' },
      },
      required: ['presentationId', 'title', 'html'],
    },
  },
  {
    name: 'update_slide',
    description: 'Update an existing slide',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        presentationId: { type: SchemaType.STRING, description: 'ID of the presentation' },
        slideId: { type: SchemaType.STRING, description: 'ID of the slide to update' },
        title: { type: SchemaType.STRING, description: 'New title (optional)' },
        html: { type: SchemaType.STRING, description: 'New HTML content (optional)' },
        notes: { type: SchemaType.STRING, description: 'New speaker notes (optional)' },
      },
      required: ['presentationId', 'slideId'],
    },
  },
  {
    name: 'delete_slide',
    description: 'Delete a slide from a presentation',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        presentationId: { type: SchemaType.STRING, description: 'ID of the presentation' },
        slideId: { type: SchemaType.STRING, description: 'ID of the slide to delete' },
      },
      required: ['presentationId', 'slideId'],
    },
  },
  {
    name: 'reorder_slides',
    description: 'Reorder slides in a presentation',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        presentationId: { type: SchemaType.STRING, description: 'ID of the presentation' },
        slideIds: {
          type: SchemaType.ARRAY,
          description: 'Array of slide IDs in the new order',
          items: { type: SchemaType.STRING },
        },
      },
      required: ['presentationId', 'slideIds'],
    },
  },
  {
    name: 'get_presentation',
    description: 'Get a presentation by ID',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        presentationId: { type: SchemaType.STRING, description: 'ID of the presentation' },
      },
      required: ['presentationId'],
    },
  },
  {
    name: 'list_presentations',
    description: 'List all presentations',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
  },
  {
    name: 'get_design_config',
    description: 'Get the user\'s preferred CSS library and the full catalog of available libraries with their CDN tags. Call this before generating slides.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
  },
  {
    name: 'finish',
    description: 'Signal that the task is complete',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        presentationId: { type: SchemaType.STRING, description: 'ID of the final presentation' },
        message: { type: SchemaType.STRING, description: 'Summary of what was done' },
      },
      required: ['presentationId'],
    },
  },
]

async function executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'create_presentation': {
      const presentation: Presentation = {
        id: createId(),
        title: args.title as string,
        description: args.description as string | undefined,
        slides: [],
        createdAt: now(),
        updatedAt: now(),
      }
      await savePresentation(presentation)
      return { id: presentation.id, title: presentation.title }
    }

    case 'add_slide': {
      const presentation = await getPresentation(args.presentationId as string)
      if (!presentation) return { error: 'Presentation not found' }
      const slide: Slide = {
        id: createId(),
        title: args.title as string,
        html: args.html as string,
        notes: args.notes as string | undefined,
        order: presentation.slides.length,
        createdAt: now(),
        updatedAt: now(),
      }
      presentation.slides.push(slide)
      presentation.updatedAt = now()
      await savePresentation(presentation)
      return { id: slide.id, title: slide.title, order: slide.order }
    }

    case 'update_slide': {
      const presentation = await getPresentation(args.presentationId as string)
      if (!presentation) return { error: 'Presentation not found' }
      const slide = presentation.slides.find(s => s.id === args.slideId)
      if (!slide) return { error: 'Slide not found' }
      if (args.title !== undefined) slide.title = args.title as string
      if (args.html !== undefined) slide.html = args.html as string
      if (args.notes !== undefined) slide.notes = args.notes as string
      slide.updatedAt = now()
      presentation.updatedAt = now()
      await savePresentation(presentation)
      return { id: slide.id, title: slide.title }
    }

    case 'delete_slide': {
      const presentation = await getPresentation(args.presentationId as string)
      if (!presentation) return { error: 'Presentation not found' }
      presentation.slides = presentation.slides.filter(s => s.id !== args.slideId)
      presentation.slides.forEach((s, i) => { s.order = i })
      presentation.updatedAt = now()
      await savePresentation(presentation)
      return { success: true }
    }

    case 'reorder_slides': {
      const presentation = await getPresentation(args.presentationId as string)
      if (!presentation) return { error: 'Presentation not found' }
      const slideIds = args.slideIds as string[]
      const slideMap = new Map(presentation.slides.map(s => [s.id, s]))
      presentation.slides = slideIds.map((id, i) => {
        const slide = slideMap.get(id)
        if (!slide) throw new Error(`Slide ${id} not found`)
        slide.order = i
        return slide
      })
      presentation.updatedAt = now()
      await savePresentation(presentation)
      return { success: true }
    }

    case 'get_presentation': {
      const presentation = await getPresentation(args.presentationId as string)
      if (!presentation) return { error: 'Presentation not found' }
      return presentation
    }

    case 'list_presentations': {
      const presentations = await listPresentations()
      return presentations.map(p => ({ id: p.id, title: p.title, slideCount: p.slides.length, createdAt: p.createdAt }))
    }

    case 'get_design_config': {
      const config = await getDesignConfig()
      return {
        currentLibrary: config.library,
        instructions:
          config.library === 'auto'
            ? 'Choose the most appropriate library for the slide content and design.'
            : `Use the "${config.library}" library. Include its CDN tag in every slide's <head>.`,
        availableLibraries: LIBRARY_CATALOG,
      }
    }

    case 'finish': {
      return { done: true, presentationId: args.presentationId, message: args.message }
    }

    default:
      return { error: `Unknown tool: ${name}` }
  }
}

export interface AgentResult {
  presentationId: string | null
  message: string
}

export async function runAgent(prompt: string, presentationId?: string): Promise<AgentResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY environment variable is required')

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_PROMPT,
    tools: [{ functionDeclarations: tools }],
  })

  const contextMessage = presentationId
    ? `Context: You are working on presentation ID: ${presentationId}\n\n${prompt}`
    : prompt

  const chat = model.startChat()
  let response = await chat.sendMessage(contextMessage)

  let finalPresentationId: string | null = presentationId ?? null
  let finalMessage = ''
  const maxIterations = 30

  for (let i = 0; i < maxIterations; i++) {
    const candidate = response.response.candidates?.[0]
    if (!candidate) break

    const functionCalls = response.response.functionCalls()
    if (!functionCalls || functionCalls.length === 0) {
      finalMessage = response.response.text()
      break
    }

    const toolResults = []
    for (const call of functionCalls) {
      const result = await executeTool(call.name, call.args as Record<string, unknown>)

      if (call.name === 'finish') {
        const finishResult = result as { presentationId: string; message?: string }
        finalPresentationId = finishResult.presentationId
        finalMessage = finishResult.message ?? 'Presentation generated successfully'
        return { presentationId: finalPresentationId, message: finalMessage }
      }

      if (call.name === 'create_presentation' && result && typeof result === 'object' && 'id' in result) {
        finalPresentationId = (result as { id: string }).id
      }

      toolResults.push({
        functionResponse: {
          name: call.name,
          response: result as object,
        },
      })
    }

    response = await chat.sendMessage(toolResults)
  }

  return { presentationId: finalPresentationId, message: finalMessage || 'Agent completed' }
}
