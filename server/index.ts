import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import fs from 'node:fs/promises'
import path from 'node:path'

const app = new Hono()

// Lokasi folder penyimpanan di dalam project ini
const VAULT_DIR = path.resolve(process.cwd(), 'snippets-vault')

// Helper: Pastikan folder vault tersedia
async function ensureVault() {
  await fs.mkdir(VAULT_DIR, { recursive: true })
}

// Helper: Ubah judul jadi nama folder yang aman (slug)
function toSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'untitled-snippet'
}

// 1. GET semua snippet dari folder snippets-vault
app.get('/api/snippets', async (c) => {
  await ensureVault()
  const entries = await fs.readdir(VAULT_DIR, { withFileTypes: true })
  const snippets = []

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const jsonPath = path.join(VAULT_DIR, entry.name, 'snippet.json')
      try {
        const raw = await fs.readFile(jsonPath, 'utf-8')
        snippets.push(JSON.parse(raw))
      } catch {
        // Lewati jika folder belum punya snippet.json
      }
    }
  }

  // Urutkan dari yang terbaru diupdate
  snippets.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  return c.json(snippets)
})

// 2. POST simpan / update snippet ke file snippet.json
app.post('/api/snippets', async (c) => {
  await ensureVault()
  const body = await c.req.json()

  const slug = body.slug ? toSlug(body.slug) : toSlug(body.title || 'untitled')
  const snippetDir = path.join(VAULT_DIR, slug)
  const assetsDir = path.join(snippetDir, 'assets')

  await fs.mkdir(assetsDir, { recursive: true })

  const now = new Date().toISOString()
  const snippetData = {
    slug,
    title: body.title || 'Untitled Snippet',
    tags: Array.isArray(body.tags) ? body.tags : [],
    useTailwind: Boolean(body.useTailwind),
    html: body.html ?? '',
    css: body.css ?? '',
    js: body.js ?? '',
    images: Array.isArray(body.images) ? body.images : [],
    createdAt: body.createdAt || now,
    updatedAt: now,
  }

  const jsonPath = path.join(snippetDir, 'snippet.json')
  await fs.writeFile(jsonPath, JSON.stringify(snippetData, null, 2), 'utf-8')

  return c.json({ ok: true, snippet: snippetData })
})

// 3. DELETE hapus folder snippet
app.delete('/api/snippets/:slug', async (c) => {
  const slug = toSlug(c.req.param('slug'))
  const snippetDir = path.join(VAULT_DIR, slug)
  await fs.rm(snippetDir, { recursive: true, force: true })
  return c.json({ ok: true })
})

const port = 3001
console.log(`🚀 Snippet Vault Server berjalan di http://localhost:${port}`)
console.log(`📁 Lokasi penyimpanan file: ${VAULT_DIR}`)

serve({ fetch: app.fetch, port })