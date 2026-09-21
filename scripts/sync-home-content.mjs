import { writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const target = resolve(root, 'src/data/home-snapshot.json')
const fallback = 'http://localhost:7070/api/v1'
const base = (process.env.API_URL || process.env.VITE_API_URL || fallback).replace(/\/$/, '')

async function get(path) {
  const response = await fetch(`${base}${path}`)
  if (!response.ok) throw new Error(`${path} → ${response.status}`)
  const body = await response.json()
  return body?.success === true && 'data' in body ? body.data : body
}

const [profile, skills, experience, listed, sectionHeaders] = await Promise.all([
  get('/profile'),
  get('/skills'),
  get('/experience'),
  get('/projects'),
  get('/section-headers'),
])

const projects = await Promise.all(
  (Array.isArray(listed) ? listed : []).map(async (item) => {
    if (!item?.slug) return item
    try {
      return await get(`/projects/${item.slug}`)
    } catch {
      return item
    }
  }),
)

const snapshot = {
  syncedAt: new Date().toISOString(),
  profile,
  skills: Array.isArray(skills) ? skills : [],
  experience: Array.isArray(experience) ? experience : [],
  projects,
  sectionHeaders: Array.isArray(sectionHeaders) ? sectionHeaders : [],
}

await writeFile(target, `${JSON.stringify(snapshot, null, 2)}\n`)
console.log(`Snapshot home actualizado: ${target}`)
console.log(`Fecha: ${snapshot.syncedAt}`)
