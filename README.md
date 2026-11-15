# Snippet Studio

A lightweight, local-first web code snippet manager and UI/UX playground. Write HTML, CSS, and JavaScript with instant live preview, attach design reference images via drag-and-drop or clipboard paste, compare your UI side-by-side, and save everything directly into your project's file system as JSON and image assets—no browser `localStorage` required.

## Features

- **Code Editor (HTML / CSS / JS):** Powered by CodeMirror 6 with dark theme, syntax highlighting, and one-click code copy.
- **Live Sandboxed Preview:** Real-time `<iframe>` rendering (300ms debounce) with responsive viewport toggles (**Desktop**, **Tablet 768px**, **Mobile 375px**) and an optional **Tailwind CSS CDN** toggle.
- **File-System Persistence:** Snippets are stored directly inside `snippets-vault/<slug>/snippet.json` via a lightweight local backend, making your snippet library Git-friendly and portable.
- **Image Attachments & Clipboard Paste:** Attach screenshots or assets via drag-and-drop, file browser, or global **`Ctrl+V`** clipboard paste. Images are stored in `snippets-vault/<slug>/assets/` and `./assets/...` paths are automatically resolved inside the live preview.
- **Design Compare Mode:** View your **Live Preview** and **Design Reference** image side-by-side (with lightbox zoom support) for accurate UI/UX slicing.
- **Interactive Console:** Collapsible console drawer that captures `console.log`, `console.warn`, `console.error`, and runtime errors from the preview iframe.
- **Search & Tag Filtering:** Search by title or tags and filter snippets with clickable `#tag` pills.
- **Resizable Split Pane & Export:** Drag the center divider to resize panels, and export any snippet as a standalone `.html` file.

## Tech Stack

- **Frontend:** Vite, React, TypeScript, Tailwind CSS v4, CodeMirror 6, Lucide React
- **Backend (Local Vault API):** Hono + `@hono/node-server` (Node.js `fs/promises`)

## Getting Started

### Prerequisites

- **Node.js** v18 or higher (v20+ recommended)
- **npm**

### Installation & Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start both the Vite frontend (`http://localhost:5173`) and the Hono vault server (`http://localhost:3001`):
   ```bash
   npm run dev
   ```

3. Open **`http://localhost:5173`** in your browser.

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl + S` / `Cmd + S` | Save current snippet to `snippets-vault/<slug>/snippet.json` |
| `Ctrl + V` / `Cmd + V` | Paste an image from clipboard directly into the snippet's `assets/` folder |

## Project & Vault Structure

```text
snippet-studio/
├── server/
│   └── index.ts              # Hono local server for JSON & image file operations
├── snippets-vault/           # Auto-created local storage for your snippets
│   └── <snippet-slug>/
│       ├── snippet.json      # Snippet metadata & HTML/CSS/JS code
│       └── assets/           # Attached images for this snippet
├── src/
│   ├── components/           # Modular UI panels (Sidebar, Navbar, Editor, Preview, Media, Compare, Console)
│   ├── types/                # TypeScript definitions
│   ├── utils/                # HTML/srcDoc builders and default templates
│   └── App.tsx
└── vite.config.ts            # Proxies /api requests to localhost:3001
```

## Using Attached Images in Your Snippets

After uploading or pasting an image in the **Images** tab, click the **Copy** icon on any image card to copy an `<img>` tag using a relative path:

```html
<img src="./assets/your-image.png" alt="your-image.png" />
```

The live preview automatically resolves `./assets/` paths to your local vault server, keeping your saved HTML clean and portable.

## Local Vault API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/snippets` | List all saved snippets from `snippets-vault/` |
| `POST` | `/api/snippets` | Create or update `snippet.json` |
| `DELETE` | `/api/snippets/:slug` | Delete a snippet folder and its assets |
| `POST` | `/api/snippets/:slug/images` | Upload an image to `assets/` and update `snippet.json` |
| `GET` | `/api/assets/:slug/:filename` | Serve a stored image asset |
| `DELETE` | `/api/snippets/:slug/images/:filename` | Delete an image asset and update `snippet.json` |