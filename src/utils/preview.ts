import type { ViewportSize } from '../types/snippet'

export const DEFAULT_HTML = `<div class="card">
  <span class="badge">UI Component</span>
  <h2>Glassmorphism Card</h2>
  <p>Edit this HTML, CSS, or JS to see live changes and save directly to your project folder.</p>
  <button id="demo-btn">Click Me</button>
</div>`

export const DEFAULT_CSS = `body {
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

export const DEFAULT_JS = `document.getElementById('demo-btn')?.addEventListener('click', () => {
  console.log('Button clicked at', new Date().toLocaleTimeString());
});`

export const VIEWPORT_CLASSES: Record<ViewportSize, string> = {
  desktop: 'w-full',
  tablet: 'w-[768px]',
  mobile: 'w-[375px]',
}

export function buildPreviewSrcDoc(params: {
  html: string
  css: string
  js: string
  useTailwind: boolean
  slug: string
  origin: string
}) {
  const { html, css, js, useTailwind, slug, origin } = params
  const tailwindTag = useTailwind
    ? '<script src="https://cdn.tailwindcss.com"></script>'
    : ''

  const assetBase = slug ? `${origin}/api/assets/${slug}/` : ''
  const resolvedHtml = slug
    ? html.replace(/(["'(])(?:\.\/)?assets\//g, `$1${assetBase}`)
    : html
  const resolvedCss = slug
    ? css.replace(/(["'(])(?:\.\/)?assets\//g, `$1${assetBase}`)
    : css

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
      ${js}
    } catch (err) {
      console.error(err);
    }
  </script>
</body>
</html>`
}

export function buildStandaloneHtml(params: {
  title: string
  html: string
  css: string
  js: string
  useTailwind: boolean
}) {
  const { title, html, css, js, useTailwind } = params
  const tailwindTag = useTailwind
    ? '  <script src="https://cdn.tailwindcss.com"></script>\n'
    : ''

  return `<!DOCTYPE html>
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
}