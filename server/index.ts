import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import fs from 'node:fs/promises'
import path from 'node:path'

const app = new Hono()

const VAULT_DIR = path.resolve(process.cwd(), 'snippets-vault')

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
}

async function ensureVault() {
  await fs.mkdir(VAULT_DIR, { recursive: true })
}

function toSlug(text: string) {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'untitled-snippet'
  )
}

// 1. GET all snippets
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
        // Ignore folders without snippet.json
      }
    }
  }

  snippets.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
  return c.json(snippets)
})

// 2. POST save or update snippet
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

// 3. DELETE snippet folder
app.delete('/api/snippets/:slug', async (c) => {
  const slug = toSlug(c.req.param('slug'))
  const snippetDir = path.join(VAULT_DIR, slug)
  await fs.rm(snippetDir, { recursive: true, force: true })
  return c.json({ ok: true })
})

// 4. POST upload image into snippets-vault/<slug>/assets/
app.post('/api/snippets/:slug/images', async (c) => {
  const slug = toSlug(c.req.param('slug'))
  const snippetDir = path.join(VAULT_DIR, slug)
  const assetsDir = path.join(snippetDir, 'assets')
  await fs.mkdir(assetsDir, { recursive: true })

  const body = await c.req.parseBody()
  const file = body['file']

  if (!file || typeof file === 'string') {
    return c.json({ ok: false, error: 'No image file provided' }, 400)
  }

  const originalName = file.name || 'pasted-image.png'
  const ext = (path.extname(originalName) || '.png').toLowerCase()
  const safeBase =
    path
      .basename(originalName, path.extname(originalName))
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .toLowerCase() || 'image'

  const filename = `${safeBase}-${Date.now()}${ext}`
  const filePath = path.join(assetsDir, filename)

  const buffer = Buffer.from(await file.arrayBuffer())
  await fs.writeFile(filePath, buffer)

  // Update snippet.json images array if it exists
  const jsonPath = path.join(snippetDir, 'snippet.json')
  let updatedImages: string[] = [filename]
  try {
    const raw = await fs.readFile(jsonPath, 'utf-8')
    const data = JSON.parse(raw)
    updatedImages = Array.isArray(data.images)
      ? [...data.images, filename]
      : [filename]
    data.images = updatedImages
    data.updatedAt = new Date().toISOString()
    await fs.writeFile(jsonPath, JSON.stringify(data, null, 2), 'utf-8')
  } catch {
    // snippet.json may not exist yet
  }

  return c.json({ ok: true, filename, images: updatedImages })
})

// 5. GET serve image asset
app.get('/api/assets/:slug/:filename', async (c) => {
  const slug = toSlug(c.req.param('slug'))
  const filename = path.basename(c.req.param('filename'))
  const filePath = path.join(VAULT_DIR, slug, 'assets', filename)

  try {
    const buffer = await fs.readFile(filePath)
    const ext = path.extname(filename).toLowerCase()
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'
    return c.body(new Uint8Array(buffer), 200, { 'Content-Type': contentType })
  } catch {
    return c.json({ error: 'Asset not found' }, 404)
  }
})

// 6. DELETE remove image from assets and snippet.json
app.delete('/api/snippets/:slug/images/:filename', async (c) => {
  const slug = toSlug(c.req.param('slug'))
  const filename = path.basename(c.req.param('filename'))
  const snippetDir = path.join(VAULT_DIR, slug)
  const filePath = path.join(snippetDir, 'assets', filename)

  await fs.rm(filePath, { force: true })

  const jsonPath = path.join(snippetDir, 'snippet.json')
  let updatedImages: string[] = []
  try {
    const raw = await fs.readFile(jsonPath, 'utf-8')
    const data = JSON.parse(raw)
    updatedImages = Array.isArray(data.images)
      ? data.images.filter((img: string) => img !== filename)
      : []
    data.images = updatedImages
    data.updatedAt = new Date().toISOString()
    await fs.writeFile(jsonPath, JSON.stringify(data, null, 2), 'utf-8')
  } catch {
    // Ignore if snippet.json doesn't exist
  }

  return c.json({ ok: true, images: updatedImages })
})

const port = 3001
console.log(`🚀 Snippet Vault Server running at http://localhost:${port}`)
console.log(`📁 Vault directory: ${VAULT_DIR}`)

serve({ fetch: app.fetch, port })