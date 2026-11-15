import { Terminal, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

export interface ConsoleEntry {
  id: number
  level: 'log' | 'warn' | 'error'
  message: string
  timestamp: string
}

interface ConsolePanelProps {
  logs: ConsoleEntry[]
  isOpen: boolean
  onToggle: () => void
  onClear: () => void
}

export function ConsolePanel({
  logs,
  isOpen,
  onToggle,
  onClear,
}: ConsolePanelProps) {
  const errorCount = logs.filter((l) => l.level === 'error').length

  return (
    <div className="flex flex-col border-t border-zinc-800 bg-zinc-950">
      {/* Header Bar */}
      <div
        onClick={onToggle}
        className="flex cursor-pointer items-center justify-between bg-zinc-900/60 px-3 py-1.5 text-xs select-none hover:bg-zinc-900"
      >
        <div className="flex items-center gap-2 font-medium text-zinc-300">
          <Terminal className="h-3.5 w-3.5 text-indigo-400" />
          <span>Console</span>
          {logs.length > 0 && (
            <span className="rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-300">
              {logs.length}
            </span>
          )}
          {errorCount > 0 && (
            <span className="rounded-full bg-red-500/20 px-1.5 py-0.5 text-[10px] text-red-400">
              {errorCount} error{errorCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {isOpen && logs.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClear()
              }}
              title="Clear Console"
              className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
          {isOpen ? (
            <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5 text-zinc-400" />
          )}
        </div>
      </div>

      {/* Log Output */}
      {isOpen && (
        <div className="h-36 overflow-y-auto p-2 font-mono text-xs">
          {logs.length === 0 ? (
            <div className="py-4 text-center text-zinc-600">
              No console output. Try adding <code>console.log()</code> in JS tab.
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex items-start gap-2 rounded px-2 py-1 ${
                    entry.level === 'error'
                      ? 'bg-red-500/10 text-red-300'
                      : entry.level === 'warn'
                        ? 'bg-amber-500/10 text-amber-300'
                        : 'text-zinc-300'
                  }`}
                >
                  <span className="shrink-0 text-[10px] text-zinc-500">
                    {entry.timestamp}
                  </span>
                  <pre className="whitespace-pre-wrap break-all">
                    {entry.message}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}