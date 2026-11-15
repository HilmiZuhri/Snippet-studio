import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
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
  Download,
  Copy,
} from 'lucide-react'
import { MediaPanel } from './components/MediaPanel'
import { ConsolePanel, type ConsoleEntry } from './components/ConsolePanel'
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
  console.log('Button clicked at', new Date().toLocaleTimeString());
});`

export default function App() {
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
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

  // UI & DX State
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
  const [copiedCode, setCopiedCode] = useState(false)
  const [debouncedCode, setDebouncedCode] = useState({ html, css, js, useTailwind })

  // Console State
  const [logs, setLogs] = useState<ConsoleEntry[]>([])
  const [isConsoleOpen, setIsConsoleOpen] = useState(false)

  // Resizable Split State
  const splitContainerRef = useRef<HTMLDivElement>(null)
  const [editorWidthPct, setEditorWidthPct] = useState(50)
  const [isResizing, setIsResizing] = useState(false)

  const currentSnapshot = JSON.stringify({
    title,
    tagsInput,
    useTailwind,
    html,
    css,
    js,
  })
  const isDirty = currentSnapshot !== savedSnapshot

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

  // Listen to console messages from iframe
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

  // Handle split pane resize drag
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
          JSON.stringify({
            title,
            tagsInput,
            useTailwind,
            html,
            css,
            js,
          })
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

  const handleDelete = async (targetSlug: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Delete snippet "${targetSlug}" from local vault?`)) return

    await fetch(`/api/snippets/${targetSlug}`, { method: 'DELETE' })
    if (slug === targetSlug) {
      handleNewSnippet()
    }
    fetchSnippets()
  }

  const handleCopyActiveTab = () => {
    const content = activeTab === 'html' ? html : activeTab === 'css' ? css : js
    navigator.clipboard.writeText(content)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 1500)
  }

  const handleExportHtml = () => {
    const tailwindTag = useTailwind
      ? '  <script src="https://cdn.tailwindcss.com"></script>\n'
      : ''
    const standalone = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
${tailwindTag}  <style>
${css}
  </style>
</head>
<body>
${html}
  <script>
${js}
  </script>
</body>
</html>`

    const blob = new Blob([standalone], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slug || 'snippet'}.html`
    a.click()
    URL.revokeObjectURL(url)
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
        if (rightMode === 'preview') {
          setRightMode('images')
        }
      }
    }

    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [handleUploadFiles, rightMode])

  // Build sandboxed HTML with console bridge + asset path resolution
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

    const consoleBridge = `<script>
      (function() {
        const send = (level, args) => {
          try {
            const formatted = args.map((a) => {
              if (typeof a === 'object' && a !== null) {
                try { return JSON.stringify(a, null, 2); } catch { return String(a); }
              }
              return String(a);
            });
            window.parent.postMessage({ type: 'snippet-console', level, message: formatted.join(' ') }, '*');
          } catch {}
        };
        const origLog = console.log;
        const origWarn = console.warn;
        const origErr = console.error;
        console.log = (...args) => { origLog(...args); send('log', args); };
        console.warn = (...args) => { origWarn(...args); send('warn', args); };
        console.error = (...args) => { origErr(...args); send('error', args); };
        window.onerror = (msg, _src, line) => {
          send('error', [msg + (line ? ' (line ' + line + ')' : '')]);
        };
      })();
    </script>`

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${tailwindTag}
  ${consoleBridge}
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

  const allTags = useMemo(() => {
    const set = new Set<string>()
    snippets.forEach((s) => s.tags.forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [snippets])

  const filteredSnippets = snippets.filter((s) => {
    const q = search.toLowerCase()
    const matchesSearch =
      s.title.toLowerCase().includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q))
    const matchesTag = !selectedTag || s.tags.includes(selectedTag)
    return matchesSearch && matchesTag
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

        {/* Search & Tag Filter */}
        <div className="space-y-2 p-3">
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

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setSelectedTag(null)}
                className={`rounded px-1.5 py-0.5 text-[10px] transition ${
                  selectedTag === null
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() =>
                    setSelectedTag((prev) => (prev === tag ? null : tag))
                  }
                  className={`rounded px-1.5 py-0.5 text-[10px] transition ${
                    selectedTag === tag
                      ? 'bg-indigo-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Snippet List */}
        <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-4">
          {filteredSnippets.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-zinc-500">
              No matching snippets found.
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
              onClick={handleExportHtml}
              title="Export as standalone .html file"
              className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>

            <button
              onClick={() => handleSave()}
              disabled={isSaving}
              className="relative flex items-center gap-1.5 rounded-md bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {savedToast ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Saved
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  {isSaving ? 'Saving...' : 'Save'}
                </>
              )}
              {isDirty && !savedToast && (
                <span
                  title="Unsaved changes"
                  className="ml-0.5 h-2 w-2 rounded-full bg-amber-400"
                />
              )}
            </button>
          </div>
        </header>

        {/* Resizable Split Pane */}
        <div
          ref={splitContainerRef}
          className={`flex flex-1 overflow-hidden ${
            isResizing ? 'select-none' : ''
          }`}
        >
          {/* Code Editor Panel */}
          <section
            style={{ width: `${editorWidthPct}%` }}
            className="flex shrink-0 flex-col"
          >
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

              <div className="flex items-center gap-2">
                {slug && (
                  <span className="hidden text-[11px] text-zinc-500 xl:inline">
                    vault/{slug}/snippet.json
                  </span>
                )}
                <button
                  onClick={handleCopyActiveTab}
                  title={`Copy ${activeTab.toUpperCase()} code`}
                  className="flex items-center gap-1 rounded px-2 py-1 text-[11px] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                >
                  {copiedCode ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
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

          {/* Draggable Divider */}
          <div
            onMouseDown={() => setIsResizing(true)}
            title="Drag to resize panels"
            className={`w-1 shrink-0 cursor-col-resize bg-zinc-800 transition hover:bg-indigo-500 ${
              isResizing ? 'bg-indigo-500' : ''
            }`}
          />

          {/* Right Panel: Preview / Images / Compare + Console */}
          <section className="flex min-w-0 flex-1 flex-col bg-zinc-900/30">
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
                    onClick={() => {
                      setLogs([])
                      setPreviewKey((k) => k + 1)
                    }}
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
                  className={`${viewportWidthClass} h-full rounded-lg border border-zinc-800 bg-white transition-all duration-200 ${
                    isResizing ? 'pointer-events-none' : ''
                  }`}
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
                      className={`${viewportWidthClass} h-full bg-white transition-all duration-200 ${
                        isResizing ? 'pointer-events-none' : ''
                      }`}
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

            {/* Collapsible Console Panel */}
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