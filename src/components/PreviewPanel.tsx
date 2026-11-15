import type { ViewportSize } from '../types/snippet'
import { VIEWPORT_CLASSES } from '../utils/preview'

interface PreviewPanelProps {
  previewKey: number
  srcDoc: string
  viewport: ViewportSize
  isResizing: boolean
}

export function PreviewPanel({
  previewKey,
  srcDoc,
  viewport,
  isResizing,
}: PreviewPanelProps) {
  return (
    <div className="flex flex-1 justify-center overflow-auto bg-zinc-950 p-3">
      <iframe
        key={previewKey}
        title="Snippet Live Preview"
        srcDoc={srcDoc}
        sandbox="allow-scripts allow-modals"
        className={`${VIEWPORT_CLASSES[viewport]} h-full rounded-lg border border-zinc-800 bg-white transition-all duration-200 ${
          isResizing ? 'pointer-events-none' : ''
        }`}
      />
    </div>
  )
}