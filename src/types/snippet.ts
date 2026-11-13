export interface Snippet {
  slug: string
  title: string
  tags: string[]
  useTailwind: boolean
  html: string
  css: string
  js: string
  images: string[]
  createdAt: string
  updatedAt: string
}

export type EditorTab = 'html' | 'css' | 'js'
export type ViewportSize = 'desktop' | 'tablet' | 'mobile'
export type RightPanelMode = 'preview' | 'images' | 'compare'