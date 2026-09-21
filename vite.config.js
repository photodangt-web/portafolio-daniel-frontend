import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function syncHomePlugin() {
  return {
    name: 'sync-home-snapshot',
    configureServer(server) {
      server.middlewares.use('/__sync-home', (req, res, next) => {
        if (req.method !== 'POST') {
          next()
          return
        }
        const chunks = []
        req.on('data', (chunk) => chunks.push(chunk))
        req.on('end', async () => {
          try {
            const snapshot = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
            const file = resolve(server.config.root, 'src/data/home-snapshot.json')
            await writeFile(file, `${JSON.stringify(snapshot, null, 2)}\n`)
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, syncedAt: snapshot.syncedAt || null }))
          } catch (error) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: false, error: error.message }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), syncHomePlugin()],
})
