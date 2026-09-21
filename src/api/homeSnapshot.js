import bundled from '../data/home-snapshot.json'
import { portfolioApi } from './portfolio'

const KEY = 'portfolio-home-snapshot'

function unwrap(value) {
  return value && typeof value === 'object' ? value : null
}

export function readHomeSnapshot() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && (parsed.profile || parsed.skills?.length)) return parsed
    }
  } catch {
    /* ignore */
  }
  return bundled
}

export function writeHomeSnapshot(snapshot) {
  try {
    localStorage.setItem(KEY, JSON.stringify(snapshot))
  } catch {
    /* ignore quota */
  }
}

export function findSnapshotProject(slug) {
  return readHomeSnapshot().projects?.find((item) => item?.slug === slug) || null
}

async function withProjectDetails(projects) {
  const list = Array.isArray(projects) ? projects : []
  return Promise.all(
    list.map(async (item) => {
      if (!item?.slug) return item
      try {
        return await portfolioApi.getProject(item.slug)
      } catch {
        return item
      }
    }),
  )
}

export async function collectHomeSnapshot() {
  const [profile, skills, experience, projects, sectionHeaders] = await Promise.all([
    portfolioApi.getProfile(),
    portfolioApi.getSkills(),
    portfolioApi.getExperience(),
    portfolioApi.getProjects(),
    portfolioApi.getSectionHeaders(),
  ])
  return {
    syncedAt: new Date().toISOString(),
    profile: unwrap(profile),
    skills: Array.isArray(skills) ? skills : [],
    experience: Array.isArray(experience) ? experience : [],
    projects: await withProjectDetails(projects),
    sectionHeaders: Array.isArray(sectionHeaders) ? sectionHeaders : [],
  }
}

export async function persistHomeSnapshot(snapshot) {
  writeHomeSnapshot(snapshot)
  const response = await fetch('/__sync-home', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(snapshot),
  })
  if (!response.ok) {
    const error = new Error('No se pudo escribir el snapshot en disco')
    error.status = response.status
    throw error
  }
  return response.json().catch(() => ({ ok: true }))
}
