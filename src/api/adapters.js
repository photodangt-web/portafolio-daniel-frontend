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

function adaptSocialLink(link) {
  return {
    platform: link.platform,
    url: link.url,
    icon: link.icon || '',
    iconKind: link.iconKind || 'class',
    iconSvg: link.iconSvg || '',
    iconPosition: link.iconPosition === 'right' ? 'right' : 'left',
    iconDisplay: ['icon', 'text', 'both'].includes(link.iconDisplay) ? link.iconDisplay : 'both',
    buttonStyle: ['outline', 'filled', 'soft'].includes(link.buttonStyle) ? link.buttonStyle : 'outline',
  }
}

function adaptHeroButton(button) {
  return {
    label: button.label || '',
    href: button.href || button.url || '',
    style: ['outline', 'filled', 'soft'].includes(button.style) ? button.style : 'outline',
    openInNewTab: Boolean(button.openInNewTab),
  }
}

export function adaptProfile(profile) {
  const socials = (profile.socialLinks || [])
    .filter(({ platform, url }) => platform && url)
    .map(adaptSocialLink)

  return {
    name: profile.name,
    role: profile.role || profile.headline,
    location: profile.location || '',
    tagline: profile.tagline || profile.headline || profile.bio,
    email: profile.email || '',
    availability: profile.availability || '',
    heroConsole: profile.heroConsole || '',
    heroButtons: (profile.heroButtons || [])
      .filter(({ label, href, url }) => label && (href || url))
      .map(adaptHeroButton),
    avatar: resolveMediaUrl(profile.avatar),
    socials,
    about: {
      paragraphs: profile.aboutParagraphs?.length ? profile.aboutParagraphs : [profile.bio],
      highlights: profile.highlights || [],
    },
  }
}

export function adaptSectionHeaders(headers) {
  if (!Array.isArray(headers)) return {}

  return Object.fromEntries(
    headers
      .filter(({ section }) => section)
      .map(({ section, eyebrow, title, description }) => [
        section,
        { eyebrow: eyebrow || '', title: title || '', description: description || '' },
      ]),
  )
}

export function adaptSkills(skills) {
  const categories = new Map()

  if (!Array.isArray(skills)) return { categories: [] }

  skills.forEach((skill) => {
    const name = String(skill?.name || '').trim()
    if (!name) return

    const title = String(skill?.category || 'Otros').trim() || 'Otros'
    const items = categories.get(title) || []
    items.push({
      name,
      icon: skill.icon || '',
      iconKind: skill.iconKind || 'class',
      iconSvg: skill.iconSvg || '',
      iconPosition: skill.iconPosition === 'right' ? 'right' : 'left',
      iconDisplay: ['icon', 'text', 'both'].includes(skill.iconDisplay) ? skill.iconDisplay : 'both',
    })
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
    slug: project.slug,
    tagline: project.tagline || '',
    description: project.summary || project.content || '',
    tags: project.technologies || [],
    year: formatDate(project.createdAt)?.slice(-4) || '',
    link: project.liveUrl || '#',
    github: project.repositoryUrl || '#',
    featured: Boolean(project.featured),
    coverImage: resolveMediaUrl(project.coverImage),
    gallery: (project.gallery || []).map(resolveMediaUrl),
    slides: project.slides || [],
  }))
}
