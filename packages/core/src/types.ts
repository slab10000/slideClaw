export interface Slide {
  id: string
  title: string
  html: string
  notes?: string
  order: number
  createdAt: string
  updatedAt: string
}

export interface Presentation {
  id: string
  title: string
  description?: string
  slides: Slide[]
  createdAt: string
  updatedAt: string
}
