import { useMemo, useState } from 'react'
import { FolderCode, Plus, Search, Trash2 } from 'lucide-react'
import type { Snippet } from '../types/snippet'

interface SidebarProps {
  snippets: Snippet[]
  activeSlug: string
  onNewSnippet: () => void
  onSelectSnippet: (snippet: Snippet) => void
  onDeleteSnippet: (slug: string, e: React.MouseEvent) => void
}

export function Sidebar({
  snippets,
  activeSlug,
  onNewSnippet,
  onSelectSnippet,
  onDeleteSnippet,
}: SidebarProps) {
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const allTags = useMemo(() => {
    const set = new Set<string>()
    snippets.forEach((s) => s.tags.forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [snippets])

  const filteredSnippets = useMemo(() => {
    const q = search.toLowerCase()
    return snippets.filter((s) => {
      const matchesSearch =
        s.title.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
      const matchesTag = !selectedTag || s.tags.includes(selectedTag)
      return matchesSearch && matchesTag
    })
  }, [snippets, search, selectedTag])

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-800 bg-zinc-900/60">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2 font-semibold tracking-tight">
          <FolderCode className="h-5 w-5 text-indigo-400" />
          <span>Snippet Studio</span>
        </div>
        <button
          onClick={onNewSnippet}
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
              onClick={() => onSelectSnippet(item)}
              className={`group flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm transition ${
                activeSlug === item.slug
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
                onClick={(e) => onDeleteSnippet(item.slug, e)}
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
  )
}