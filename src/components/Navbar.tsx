import { Check, Download, Save, Sparkles } from 'lucide-react'

interface NavbarProps {
  title: string
  tagsInput: string
  useTailwind: boolean
  isSaving: boolean
  savedToast: boolean
  isDirty: boolean
  onTitleChange: (val: string) => void
  onTagsChange: (val: string) => void
  onToggleTailwind: () => void
  onExport: () => void
  onSave: () => void
}

export function Navbar({
  title,
  tagsInput,
  useTailwind,
  isSaving,
  savedToast,
  isDirty,
  onTitleChange,
  onTagsChange,
  onToggleTailwind,
  onExport,
  onSave,
}: NavbarProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900/40 px-4 py-2.5">
      <div className="flex flex-1 items-center gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Snippet Title"
          className="w-56 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-sm font-medium text-zinc-100 focus:border-indigo-500 focus:outline-none"
        />
        <input
          type="text"
          value={tagsInput}
          onChange={(e) => onTagsChange(e.target.value)}
          placeholder="Tags (comma separated: card, ui)"
          className="w-60 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleTailwind}
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
          onClick={onExport}
          title="Export as standalone .html file"
          className="flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </button>

        <button
          onClick={onSave}
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
  )
}