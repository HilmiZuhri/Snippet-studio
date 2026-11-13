import { useRef, useState } from 'react'
import {
  Upload,
  Trash2,
  Copy,
  Check,
  Maximize2,
  X,
  Columns2,
} from 'lucide-react'

interface MediaPanelProps {
  slug: string
  images: string[]
  referenceImage: string | null
  isUploading: boolean
  onUploadFiles: (files: FileList | File[]) => void
  onDeleteImage: (filename: string) => void
  onSelectReference: (filename: string) => void
}

export function MediaPanel({
  slug,
  images,
  referenceImage,
  isUploading,
  onUploadFiles,
  onDeleteImage,
  onSelectReference,
}: MediaPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [copiedImg, setCopiedImg] = useState<string | null>(null)
  const [zoomedImg, setZoomedImg] = useState<string | null>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files?.length) {
      onUploadFiles(e.dataTransfer.files)
    }
  }

  const copyHtmlTag = (filename: string) => {
    const tag = `<img src="./assets/${filename}" alt="${filename}" />`
    navigator.clipboard.writeText(tag)
    setCopiedImg(filename)
    setTimeout(() => setCopiedImg(null), 1500)
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-zinc-950 p-4">
      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition ${
          isDragging
            ? 'border-indigo-400 bg-indigo-500/10'
            : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/70'
        }`}
      >
        <Upload className="mb-2 h-6 w-6 text-indigo-400" />
        <p className="text-sm font-medium text-zinc-200">
          {isUploading
            ? 'Uploading image...'
            : 'Drop images here, click to browse, or press Ctrl+V'}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Saved locally inside{' '}
          <code className="text-zinc-400">
            snippets-vault/{slug || '<auto-slug>'}/assets/
          </code>
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) {
              onUploadFiles(e.target.files)
              e.target.value = ''
            }
          }}
        />
      </div>

      {/* Image Grid */}
      {images.length === 0 ? (
        <div className="mt-10 text-center text-xs text-zinc-500">
          No images attached to this snippet yet.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {images.map((filename) => {
            const imgUrl = `/api/assets/${slug}/${filename}`
            const isRef = referenceImage === filename
            return (
              <div
                key={filename}
                className={`group overflow-hidden rounded-lg border bg-zinc-900/60 transition ${
                  isRef ? 'border-indigo-500' : 'border-zinc-800'
                }`}
              >
                <div className="relative aspect-video bg-zinc-950">
                  <img
                    src={imgUrl}
                    alt={filename}
                    className="h-full w-full object-contain"
                  />
                  <button
                    onClick={() => setZoomedImg(imgUrl)}
                    title="Zoom Image"
                    className="absolute top-2 right-2 rounded-md bg-black/70 p-1.5 text-zinc-200 opacity-0 transition hover:bg-black group-hover:opacity-100"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-zinc-800 px-3 py-2">
                  <span className="truncate text-xs text-zinc-300" title={filename}>
                    {filename}
                  </span>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => onSelectReference(filename)}
                      title="Use as Compare Reference"
                      className={`rounded p-1.5 text-xs transition ${
                        isRef
                          ? 'bg-indigo-600 text-white'
                          : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      <Columns2 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => copyHtmlTag(filename)}
                      title="Copy <img> HTML tag"
                      className="rounded p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
                    >
                      {copiedImg === filename ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => onDeleteImage(filename)}
                      title="Delete Image"
                      className="rounded p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {zoomedImg && (
        <div
          onClick={() => setZoomedImg(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-6 backdrop-blur-xs"
        >
          <button
            onClick={() => setZoomedImg(null)}
            className="absolute top-4 right-4 rounded-full bg-zinc-900 p-2 text-zinc-200 hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={zoomedImg}
            alt="Zoomed preview"
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full rounded-lg border border-zinc-800 object-contain"
          />
        </div>
      )}
    </div>
  )
}