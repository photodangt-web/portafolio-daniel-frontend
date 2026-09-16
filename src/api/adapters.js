import { resolveMediaUrl } from './client'

const dateFormatter = new Intl.DateTimeFormat('es', {
  month: 'short',
  year: 'numeric',
})

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : dateFormatter.format(date)
}

function formatPeriod({ startDate, endDate, current }) {
  const start = formatDate(startDate)
  const end = current ? 'Presente' : formatDate(endDate)

  return [start, end].filter(Boolean).join(' — ')
}

export function adaptProfile(profile) {
  const socials = Object.fromEntries(
    (profile.socialLinks || [])
      .filter(({ platform, url }) => platform && url)
      .map(({ platform, url }) => [platform.toLowerCase(), url]),
  )

  return {
    name: profile.name,
    role: profile.role || profile.headline,
    location: profile.location || '',
    tagline: profile.tagline || profile.headline || profile.bio,
    email: profile.email || '',
    availability: profile.availability || '',
    heroConsole: profile.heroConsole || '',
    avatar: resolveMediaUrl(profile.avatar),
    socials,
    about: {
      paragraphs: profile.aboutParagraphs?.length ? profile.aboutParagraphs : [profile.bio],
      highlights: profile.highlights || [],
    },
  }
}

export function adaptSkills(skills) {
  const categories = new Map()

  if (!Array.isArray(skills)) return { categories: [] }

  skills.forEach((skill) => {
    const name = String(skill?.name || '').trim()
    if (!name) return

    const title = String(skill?.category || 'Otros').trim() || 'Otros'
    const items = categories.get(title) || []
    items.push(name)
    categories.set(title, items)
  })

  return { categories: [...categories].map(([title, items]) => ({ title, items })) }
}

export function adaptExperience(experience) {
  return experience.map((item) => ({
    company: item.company,
    role: item.role,
    period: formatPeriod(item),
    location: item.location || '',
    description: item.description || '',
    highlights: item.highlights?.length ? item.highlights : item.technologies || [],
  }))
}

export function adaptProjects(projects) {
  return projects.map((project) => ({
    title: project.title,
    description: project.summary || project.content || '',
    tags: project.technologies || [],
    year: formatDate(project.createdAt)?.slice(-4) || '',
    link: project.liveUrl || '#',
    github: project.repositoryUrl || '#',
    featured: Boolean(project.featured),
    coverImage: resolveMediaUrl(project.coverImage),
  }))
}
