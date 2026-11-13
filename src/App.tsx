import { useEffect, useMemo, useState, useCallback } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { html as htmlLang } from '@codemirror/lang-html'
import { css as cssLang } from '@codemirror/lang-css'
import { javascript as jsLang } from '@codemirror/lang-javascript'
import {
  Plus,
  Save,
  Trash2,
  Search,
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  FolderCode,
  Check,
  Sparkles,
  Eye,
  Image as ImageIcon,
  Columns2,
} from 'lucide-react'
import { MediaPanel } from './components/MediaPanel'
import type {
  EditorTab,
  RightPanelMode,
  Snippet,
  ViewportSize,
} from './types/snippet'

const DEFAULT_HTML = `<div class="card">
  <span class="badge">UI Component</span>
  <h2>Glassmorphism Card</h2>
  <p>Edit this HTML, CSS, or JS to see live changes and save directly to your project folder.</p>
  <button id="demo-btn">Click Me</button>
</div>`

const DEFAULT_CSS = `body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #0f172a, #1e1b4b);
  font-family: system-ui, sans-serif;
  color: #f8fafc;
}

.card {
  max-width: 340px;
  padding: 24px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
}

.badge {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(99, 102, 241, 0.25);
  color: #a5b4fc;
}

h2 { margin: 14px 0 8px; font-size: 20px; }
p { margin: 0 0 18px; font-size: 14px; color: #cbd5e1; line-height: 1.5; }

button {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 10px;
  background: #6366f1;
  color: white;
  font-weight: 600;
  cursor: pointer;
}
button:hover { background: #4f46e5; }`

const DEFAULT_JS = `document.getElementById('demo-btn')?.addEventListener('click', () => {
  alert('Snippet is working!');
});`

export default function App() {
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [search, setSearch] = useState('')
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

  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [savedToast, setSavedToast] = useState(false)
  const [debouncedCode, setDebouncedCode] = useState({ html, css, js, useTailwind })

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
      setDebouncedCode({ html, css, js, useTailwind })
    }, 300)
    return () => clearTimeout(timer)
  }, [html, css, js, useTailwind])

  const loadSnippet = (snippet: Snippet) => {
    setSlug(snippet.slug)
    setTitle(snippet.title)
    setTagsInput(snippet.tags.join(', '))
    setUseTailwind(snippet.useTailwind)
    setHtml(snippet.html)
    setCss(snippet.css)
    setJs(snippet.js)
    const imgs = snippet.images || []
    setImages(imgs)
    setReferenceImage(imgs[0] || null)
    setCreatedAt(snippet.createdAt)
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
  }

  // Save snippet and return saved slug
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
        // Ensure snippet exists on disk before uploading assets
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

  const handleDelete = async (targetSlug: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Delete snippet "${targetSlug}" from local vault?`)) return

    await fetch(`/api/snippets/${targetSlug}`, { method: 'DELETE' })
    if (slug === targetSlug) {
      handleNewSnippet()
    }
    fetchSnippets()
  }

  // Ctrl+S / Cmd+S shortcut
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

  // Global Ctrl+V clipboard image paste support
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
        if (rightMode === 'preview') {
          setRightMode('images')
        }
      }
    }

    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [handleUploadFiles, rightMode])

  // Build sandboxed HTML and resolve ./assets/ paths to local backend URLs
  const srcDoc = useMemo(() => {
    const tailwindTag = debouncedCode.useTailwind
      ? '<script src="https://cdn.tailwindcss.com"></script>'
      : ''

    const assetBase = slug ? `${window.location.origin}/api/assets/${slug}/` : ''
    const resolvedHtml = slug
      ? debouncedCode.html.replace(/(["'(])(?:\.\/)?assets\//g, `$1${assetBase}`)
      : debouncedCode.html
    const resolvedCss = slug
      ? debouncedCode.css.replace(/(["'(])(?:\.\/)?assets\//g, `$1${assetBase}`)
      : debouncedCode.css

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${tailwindTag}
  <style>${resolvedCss}</style>
</head>
<body>
  ${resolvedHtml}
  <script>
    try {
      ${debouncedCode.js}
    } catch (err) {
      console.error(err);
    }
  </script>
</body>
</html>`
  }, [debouncedCode, slug])

  const filteredSnippets = snippets.filter((s) => {
    const q = search.toLowerCase()
    return (
      s.title.toLowerCase().includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q))
    )
  })

  const viewportWidthClass = {
    desktop: 'w-full',
    tablet: 'w-[768px]',
    mobile: 'w-[375px]',
  }[viewport]

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100">
      {/* LEFT SIDEBAR: Vault Explorer */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-800 bg-zinc-900/60">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-2 font-semibold tracking-tight">
            <FolderCode className="h-5 w-5 text-indigo-400" />
            <span>Snippet Studio</span>
          </div>
          <button
            onClick={handleNewSnippet}
            title="New Snippet"
            className="rounded-md bg-indigo-600 p-1.5 text-white transition hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search snippets or tags..."
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 py-1.5 pr-3 pl-8 text-xs text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Snippet List */}
        <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-4">
          {filteredSnippets.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-zinc-500">
              No snippets saved yet.
              <br />
              Press Save (Ctrl+S) to store in vault.
            </p>
          ) : (
            filteredSnippets.map((item) => (
              <div
                key={item.slug}
                onClick={() => loadSnippet(item)}
                className={`group flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm transition ${
                  slug === item.slug
                    ? 'bg-indigo-600/20 text-indigo-300'
                    : 'text-zinc-300 hover:bg-zinc-800/70'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-medium">{item.title}</span>
                    {item.images?.length > 0 && (
                      <span className="shrink-0 rounded bg-zinc-800 px-1 py-0.5 text-[10px] text-zinc-400">
                        {item.images.length} img
                      </span>
                    )}
                  </div>
                  {item.tags.length > 0 && (
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => handleDelete(item.slug, e)}
                  title="Delete Snippet"
                  className="ml-2 hidden rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-red-400 group-hover:block"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Metadata & Action Bar */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900/40 px-4 py-2.5">
          <div className="flex flex-1 items-center gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Snippet Title"
              className="w-56 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm font-medium text-zinc-100 focus:border-indigo-500 focus:outline-none"
            />
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Tags (comma separated: card, ui)"
              className="w-60 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setUseTailwind((v) => !v)}
              className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition ${
                useTailwind
                  ? 'border-sky-500/50 bg-sky-500/15 text-sky-300'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
              }`}
              title="Toggle Tailwind CSS CDN in Live Preview"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Tailwind CDN
            </button>

            <button
              onClick={() => handleSave()}
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {savedToast ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Saved to JSON
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  {isSaving ? 'Saving...' : 'Save'}
                </>
              )}
            </button>
          </div>
        </header>

        {/* Split Pane: Code Editor (Left) & Preview/Media (Right) */}
        <div className="flex flex-1 overflow-hidden">
          {/* Code Editor Panel */}
          <section className="flex w-1/2 flex-col border-r border-zinc-800">
            <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-3">
              <div className="flex">
                {(['html', 'css', 'js'] as EditorTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`border-b-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                      activeTab === tab
                        ? 'border-indigo-500 text-indigo-400'
                        : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              {slug && (
                <span className="text-[11px] text-zinc-500">
                  vault/{slug}/snippet.json
                </span>
              )}
            </div>

            <div className="flex-1 overflow-auto bg-[#282c34]">
              {activeTab === 'html' && (
                <CodeMirror
                  value={html}
                  height="100%"
                  theme="dark"
                  extensions={[htmlLang()]}
                  onChange={(val) => setHtml(val)}
                  className="h-full text-sm"
                />
              )}
              {activeTab === 'css' && (
                <CodeMirror
                  value={css}
                  height="100%"
                  theme="dark"
                  extensions={[cssLang()]}
                  onChange={(val) => setCss(val)}
                  className="h-full text-sm"
                />
              )}
              {activeTab === 'js' && (
                <CodeMirror
                  value={js}
                  height="100%"
                  theme="dark"
                  extensions={[jsLang()]}
                  onChange={(val) => setJs(val)}
                  className="h-full text-sm"
                />
              )}
            </div>
          </section>

          {/* Right Panel: Preview / Images / Compare */}
          <section className="flex w-1/2 flex-col bg-zinc-900/30">
            {/* Mode & Viewport Toolbar */}
            <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-3 py-1.5">
              <div className="flex items-center gap-1 rounded-md bg-zinc-950 p-0.5">
                <button
                  onClick={() => setRightMode('preview')}
                  className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition ${
                    rightMode === 'preview'
                      ? 'bg-zinc-800 text-indigo-400'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </button>
                <button
                  onClick={() => setRightMode('images')}
                  className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition ${
                    rightMode === 'images'
                      ? 'bg-zinc-800 text-indigo-400'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  Images ({images.length})
                </button>
                <button
                  onClick={() => setRightMode('compare')}
                  className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition ${
                    rightMode === 'compare'
                      ? 'bg-zinc-800 text-indigo-400'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Columns2 className="h-3.5 w-3.5" />
                  Compare
                </button>
              </div>

              {rightMode !== 'images' && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewport('desktop')}
                    title="Desktop View"
                    className={`rounded p-1.5 ${
                      viewport === 'desktop'
                        ? 'bg-zinc-800 text-indigo-400'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <Monitor className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setViewport('tablet')}
                    title="Tablet View (768px)"
                    className={`rounded p-1.5 ${
                      viewport === 'tablet'
                        ? 'bg-zinc-800 text-indigo-400'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <Tablet className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setViewport('mobile')}
                    title="Mobile View (375px)"
                    className={`rounded p-1.5 ${
                      viewport === 'mobile'
                        ? 'bg-zinc-800 text-indigo-400'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                  </button>

                  <div className="mx-1 h-4 w-px bg-zinc-800" />

                  <button
                    onClick={() => setPreviewKey((k) => k + 1)}
                    title="Reload Preview"
                    className="rounded p-1.5 text-zinc-500 hover:text-zinc-300"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Right Panel Body */}
            {rightMode === 'preview' && (
              <div className="flex flex-1 justify-center overflow-auto bg-zinc-950 p-3">
                <iframe
                  key={previewKey}
                  title="Snippet Live Preview"
                  srcDoc={srcDoc}
                  sandbox="allow-scripts allow-modals"
                  className={`${viewportWidthClass} h-full rounded-lg border border-zinc-800 bg-white transition-all duration-200`}
                />
              </div>
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
              <div className="flex flex-1 flex-col gap-3 overflow-hidden bg-zinc-950 p-3">
                <div className="flex h-1/2 flex-col">
                  <span className="mb-1 text-[11px] font-medium text-zinc-400">
                    Live Preview
                  </span>
                  <div className="flex flex-1 justify-center overflow-auto rounded-lg border border-zinc-800 bg-zinc-900">
                    <iframe
                      key={previewKey}
                      title="Compare Live Preview"
                      srcDoc={srcDoc}
                      sandbox="allow-scripts allow-modals"
                      className={`${viewportWidthClass} h-full bg-white transition-all duration-200`}
                    />
                  </div>
                </div>

                <div className="flex h-1/2 flex-col">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-zinc-400">
                      Design Reference
                    </span>
                    {images.length > 1 && (
                      <select
                        value={referenceImage || ''}
                        onChange={(e) => setReferenceImage(e.target.value)}
                        className="rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-300 focus:outline-none"
                      >
                        {images.map((img) => (
                          <option key={img} value={img}>
                            {img}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="flex flex-1 items-center justify-center overflow-auto rounded-lg border border-zinc-800 bg-zinc-900/50 p-2">
                    {referenceImage && slug ? (
                      <img
                        src={`/api/assets/${slug}/${referenceImage}`}
                        alt="Design Reference"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-center text-xs text-zinc-500">
                        No reference image attached.
                        <br />
                        Go to <strong>Images</strong> tab or press{' '}
                        <strong>Ctrl+V</strong> to paste a screenshot.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}