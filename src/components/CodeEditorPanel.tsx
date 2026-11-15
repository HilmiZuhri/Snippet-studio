import { useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { html as htmlLang } from '@codemirror/lang-html'
import { css as cssLang } from '@codemirror/lang-css'
import { javascript as jsLang } from '@codemirror/lang-javascript'
import { Check, Copy } from 'lucide-react'
import type { EditorTab } from '../types/snippet'

interface CodeEditorPanelProps {
  widthPct: number
  activeTab: EditorTab
  slug: string
  html: string
  css: string
  js: string
  onTabChange: (tab: EditorTab) => void
  onHtmlChange: (val: string) => void
  onCssChange: (val: string) => void
  onJsChange: (val: string) => void
}

export function CodeEditorPanel({
  widthPct,
  activeTab,
  slug,
  html,
  css,
  js,
  onTabChange,
  onHtmlChange,
  onCssChange,
  onJsChange,
}: CodeEditorPanelProps) {
  const [copiedCode, setCopiedCode] = useState(false)

  const handleCopyActiveTab = () => {
    const content = activeTab === 'html' ? html : activeTab === 'css' ? css : js
    navigator.clipboard.writeText(content)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 1500)
  }

  return (
    <section
      style={{ width: `${widthPct}%` }}
      className="flex shrink-0 flex-col"
    >
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-3">
        <div className="flex">
          {(['html', 'css', 'js'] as EditorTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
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
            onChange={onHtmlChange}
            className="h-full text-sm"
          />
        )}
        {activeTab === 'css' && (
          <CodeMirror
            value={css}
            height="100%"
            theme="dark"
            extensions={[cssLang()]}
            onChange={onCssChange}
            className="h-full text-sm"
          />
        )}
        {activeTab === 'js' && (
          <CodeMirror
            value={js}
            height="100%"
            theme="dark"
            extensions={[jsLang()]}
            onChange={onJsChange}
            className="h-full text-sm"
          />
        )}
      </div>
    </section>
  )
}