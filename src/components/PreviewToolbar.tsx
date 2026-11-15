import {
  Columns2,
  Eye,
  Image as ImageIcon,
  Monitor,
  RefreshCw,
  Smartphone,
  Tablet,
} from 'lucide-react'
import type { RightPanelMode, ViewportSize } from '../types/snippet'

interface PreviewToolbarProps {
  rightMode: RightPanelMode
  imagesCount: number
  viewport: ViewportSize
  onModeChange: (mode: RightPanelMode) => void
  onViewportChange: (vp: ViewportSize) => void
  onReload: () => void
}

export function PreviewToolbar({
  rightMode,
  imagesCount,
  viewport,
  onModeChange,
  onViewportChange,
  onReload,
}: PreviewToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-3 py-1.5">
      <div className="flex items-center gap-1 rounded-md bg-zinc-950 p-0.5">
        <button
          onClick={() => onModeChange('preview')}
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
          onClick={() => onModeChange('images')}
          className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition ${
            rightMode === 'images'
              ? 'bg-zinc-800 text-indigo-400'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ImageIcon className="h-3.5 w-3.5" />
          Images ({imagesCount})
        </button>
        <button
          onClick={() => onModeChange('compare')}
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
            onClick={() => onViewportChange('desktop')}
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
            onClick={() => onViewportChange('tablet')}
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
            onClick={() => onViewportChange('mobile')}
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
            onClick={onReload}
            title="Reload Preview"
            className="rounded p-1.5 text-zinc-500 hover:text-zinc-300"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}