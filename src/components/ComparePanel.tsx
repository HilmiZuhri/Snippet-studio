import type { ViewportSize } from '../types/snippet'
import { VIEWPORT_CLASSES } from '../utils/preview'

interface ComparePanelProps {
  previewKey: number
  srcDoc: string
  viewport: ViewportSize
  isResizing: boolean
  slug: string
  images: string[]
  referenceImage: string | null
  onSelectReference: (filename: string) => void
}

export function ComparePanel({
  previewKey,
  srcDoc,
  viewport,
  isResizing,
  slug,
  images,
  referenceImage,
  onSelectReference,
}: ComparePanelProps) {
  return (
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
            className={`${VIEWPORT_CLASSES[viewport]} h-full bg-white transition-all duration-200 ${
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
              onChange={(e) => onSelectReference(e.target.value)}
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
  )
}