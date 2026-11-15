import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { Sidebar } from './components/Sidebar'
import { Navbar } from './components/Navbar'
import { CodeEditorPanel } from './components/CodeEditorPanel'
import { PreviewToolbar } from './components/PreviewToolbar'
import { PreviewPanel } from './components/PreviewPanel'
import { MediaPanel } from './components/MediaPanel'
import { ComparePanel } from './components/ComparePanel'
import { ConsolePanel, type ConsoleEntry } from './components/ConsolePanel'
import {
  DEFAULT_CSS,
  DEFAULT_HTML,
  DEFAULT_JS,
  buildPreviewSrcDoc,
  buildStandaloneHtml,
} from './utils/preview'
import type {
  EditorTab,
  RightPanelMode,
  Snippet,
  ViewportSize,
} from './types/snippet'

export default function App() {
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [activeTab, setActiveTab] = useState<EditorTab>('html')
  const [rightMode, setRightMode] = useState<RightPanelMode>('preview')
  const [viewport, setViewport] = useState<ViewportSize>('desktop')
  const [previewKey, setPreviewKey] = useState(0)

  // Editor State
  const [slug, setSlug] = useState('')
  const [title, setTitle] = useState('Untitled Snippet')
  const [tagsInput, setTagsInput] = useState('')
  const [useTailwind, setUseTailwind] = useState(false)
  const [html, setHtml] = useState(DEFAULT_HTML)
  const [css, setCss] = useState(DEFAULT_CSS)
  const [js, setJs] = useState(DEFAULT_JS)
  const [images, setImages] = useState<string[]>([])
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [createdAt, setCreatedAt] = useState<string | undefined>(undefined)

  // UI & Status State
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify({
      title: 'Untitled Snippet',
      tagsInput: '',
      useTailwind: false,
      html: DEFAULT_HTML,
      css: DEFAULT_CSS,
      js: DEFAULT_JS,
    })
  )
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [savedToast, setSavedToast] = useState(false)
  const [debouncedCode, setDebouncedCode] = useState({ html, css, js, useTailwind })

  // Console & Split Resize State
  const [logs, setLogs] = useState<ConsoleEntry[]>([])
  const [isConsoleOpen, setIsConsoleOpen] = useState(false)
  const splitContainerRef = useRef<HTMLDivElement>(null)
  const [editorWidthPct, setEditorWidthPct] = useState(50)
  const [isResizing, setIsResizing] = useState(false)

  const isDirty =
    JSON.stringify({ title, tagsInput, useTailwind, html, css, js }) !==
    savedSnapshot

  const fetchSnippets = useCallback(async () => {
    try {
      const res = await fetch('/api/snippets')
      if (res.ok) {
        const data: Snippet[] = await res.json()
        setSnippets(data)
      }
    } catch (err) {
      console.error('Failed to load snippets:', err)
    }
  }, [])

  useEffect(() => {
    fetchSnippets()
  }, [fetchSnippets])

  useEffect(() => {
    const timer = setTimeout(() => {
      setLogs([])
      setDebouncedCode({ html, css, js, useTailwind })
    }, 300)
    return () => clearTimeout(timer)
  }, [html, css, js, useTailwind])

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'snippet-console') {
        setLogs((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            level: e.data.level,
            message: e.data.message,
            timestamp: new Date().toLocaleTimeString(),
          },
        ])
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  useEffect(() => {
    if (!isResizing) return
    const onMouseMove = (e: MouseEvent) => {
      if (!splitContainerRef.current) return
      const rect = splitContainerRef.current.getBoundingClientRect()
      const pct = ((e.clientX - rect.left) / rect.width) * 100
      setEditorWidthPct(Math.min(75, Math.max(25, pct)))
    }
    const onMouseUp = () => setIsResizing(false)

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [isResizing])

  const loadSnippet = (snippet: Snippet) => {
    const joinedTags = snippet.tags.join(', ')
    setSlug(snippet.slug)
    setTitle(snippet.title)
    setTagsInput(joinedTags)
    setUseTailwind(snippet.useTailwind)
    setHtml(snippet.html)
    setCss(snippet.css)
    setJs(snippet.js)
    const imgs = snippet.images || []
    setImages(imgs)
    setReferenceImage(imgs[0] || null)
    setCreatedAt(snippet.createdAt)
    setLogs([])
    setSavedSnapshot(
      JSON.stringify({
        title: snippet.title,
        tagsInput: joinedTags,
        useTailwind: snippet.useTailwind,
        html: snippet.html,
        css: snippet.css,
        js: snippet.js,
      })
    )
  }

  const handleNewSnippet = () => {
    setSlug('')
    setTitle('Untitled Snippet')
    setTagsInput('')
    setUseTailwind(false)
    setHtml(DEFAULT_HTML)
    setCss(DEFAULT_CSS)
    setJs(DEFAULT_JS)
    setImages([])
    setReferenceImage(null)
    setCreatedAt(undefined)
    setLogs([])
    setSavedSnapshot(
      JSON.stringify({
        title: 'Untitled Snippet',
        tagsInput: '',
        useTailwind: false,
        html: DEFAULT_HTML,
        css: DEFAULT_CSS,
        js: DEFAULT_JS,
      })
    )
  }

  const handleSave = useCallback(async (): Promise<string | null> => {
    setIsSaving(true)
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      const res = await fetch('/api/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: slug || undefined,
          title,
          tags,
          useTailwind,
          html,
          css,
          js,
          images,
          createdAt,
        }),
      })

      if (res.ok) {
        const result = await res.json()
        setSlug(result.snippet.slug)
        setCreatedAt(result.snippet.createdAt)
        setSavedSnapshot(
          JSON.stringify({ title, tagsInput, useTailwind, html, css, js })
        )
        await fetchSnippets()
        setSavedToast(true)
        setTimeout(() => setSavedToast(false), 2000)
        return result.snippet.slug
      }
    } catch (err) {
      console.error('Failed to save snippet:', err)
    } finally {
      setIsSaving(false)
    }
    return null
  }, [slug, title, tagsInput, useTailwind, html, css, js, images, createdAt, fetchSnippets])

  const handleUploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const imageFiles = Array.from(files).filter((f) =>
        f.type.startsWith('image/')
      )
      if (imageFiles.length === 0) return

      setIsUploading(true)
      try {
        let activeSlug = slug
        if (!activeSlug) {
          const createdSlug = await handleSave()
          if (!createdSlug) return
          activeSlug = createdSlug
        }

        let latestImages = [...images]
        for (const file of imageFiles) {
          const formData = new FormData()
          formData.append('file', file)
          const res = await fetch(`/api/snippets/${activeSlug}/images`, {
            method: 'POST',
            body: formData,
          })
          if (res.ok) {
            const data = await res.json()
            latestImages = data.images
          }
        }

        setImages(latestImages)
        if (!referenceImage && latestImages.length > 0) {
          setReferenceImage(latestImages[0])
        }
        await fetchSnippets()
      } catch (err) {
        console.error('Failed to upload image:', err)
      } finally {
        setIsUploading(false)
      }
    },
    [slug, images, referenceImage, handleSave, fetchSnippets]
  )

  const handleDeleteImage = async (filename: string) => {
    if (!slug) return
    const res = await fetch(`/api/snippets/${slug}/images/${filename}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      const data = await res.json()
      setImages(data.images)
      if (referenceImage === filename) {
        setReferenceImage(data.images[0] || null)
      }
      fetchSnippets()
    }
  }

  const handleDeleteSnippet = async (targetSlug: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Delete snippet "${targetSlug}" from local vault?`)) return
    await fetch(`/api/snippets/${targetSlug}`, { method: 'DELETE' })
    if (slug === targetSlug) handleNewSnippet()
    fetchSnippets()
  }

  const handleExportHtml = () => {
    const content = buildStandaloneHtml({ title, html, css, js, useTailwind })
    const blob = new Blob([content], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slug || 'snippet'}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Ctrl+S shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleSave])

  // Global Ctrl+V clipboard image paste
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      const pastedImages: File[] = []
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) pastedImages.push(file)
        }
      }
      if (pastedImages.length > 0) {
        e.preventDefault()
        handleUploadFiles(pastedImages)
        if (rightMode === 'preview') setRightMode('images')
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [handleUploadFiles, rightMode])

  const srcDoc = useMemo(
    () =>
      buildPreviewSrcDoc({
        ...debouncedCode,
        slug,
        origin: window.location.origin,
      }),
    [debouncedCode, slug]
  )

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <Sidebar
        snippets={snippets}
        activeSlug={slug}
        onNewSnippet={handleNewSnippet}
        onSelectSnippet={loadSnippet}
        onDeleteSnippet={handleDeleteSnippet}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar
          title={title}
          tagsInput={tagsInput}
          useTailwind={useTailwind}
          isSaving={isSaving}
          savedToast={savedToast}
          isDirty={isDirty}
          onTitleChange={setTitle}
          onTagsChange={setTagsInput}
          onToggleTailwind={() => setUseTailwind((v) => !v)}
          onExport={handleExportHtml}
          onSave={() => handleSave()}
        />

        <div
          ref={splitContainerRef}
          className={`flex flex-1 overflow-hidden ${isResizing ? 'select-none' : ''}`}
        >
          <CodeEditorPanel
            widthPct={editorWidthPct}
            activeTab={activeTab}
            slug={slug}
            html={html}
            css={css}
            js={js}
            onTabChange={setActiveTab}
            onHtmlChange={setHtml}
            onCssChange={setCss}
            onJsChange={setJs}
          />

          <div
            onMouseDown={() => setIsResizing(true)}
            title="Drag to resize panels"
            className={`w-1 shrink-0 cursor-col-resize bg-zinc-800 transition hover:bg-indigo-500 ${
              isResizing ? 'bg-indigo-500' : ''
            }`}
          />

          <section className="flex min-w-0 flex-1 flex-col bg-zinc-900/30">
            <PreviewToolbar
              rightMode={rightMode}
              imagesCount={images.length}
              viewport={viewport}
              onModeChange={setRightMode}
              onViewportChange={setViewport}
              onReload={() => {
                setLogs([])
                setPreviewKey((k) => k + 1)
              }}
            />

            {rightMode === 'preview' && (
              <PreviewPanel
                previewKey={previewKey}
                srcDoc={srcDoc}
                viewport={viewport}
                isResizing={isResizing}
              />
            )}

            {rightMode === 'images' && (
              <MediaPanel
                slug={slug}
                images={images}
                referenceImage={referenceImage}
                isUploading={isUploading}
                onUploadFiles={handleUploadFiles}
                onDeleteImage={handleDeleteImage}
                onSelectReference={(filename) => {
                  setReferenceImage(filename)
                  setRightMode('compare')
                }}
              />
            )}

            {rightMode === 'compare' && (
              <ComparePanel
                previewKey={previewKey}
                srcDoc={srcDoc}
                viewport={viewport}
                isResizing={isResizing}
                slug={slug}
                images={images}
                referenceImage={referenceImage}
                onSelectReference={setReferenceImage}
              />
            )}

            {rightMode !== 'images' && (
              <ConsolePanel
                logs={logs}
                isOpen={isConsoleOpen}
                onToggle={() => setIsConsoleOpen((o) => !o)}
                onClear={() => setLogs([])}
              />
            )}
          </section>
        </div>
      </div>
    </div>
  )
}