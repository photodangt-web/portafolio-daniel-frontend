import { Component, useEffect, useState } from 'react'
import { resolveMediaUrl } from '../api/client'

function safeSvg(markup = '') {
  return String(markup)
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+=("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
}

function iconifyUrl(value = '') {
  const [prefix, ...rest] = String(value).trim().split(':')
  const name = rest.join(':').trim()
  if (!prefix || !name) return ''
  return `https://api.iconify.design/${encodeURIComponent(prefix)}/${encodeURIComponent(name)}.svg`
}

class IconGuard extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) return null
    return this.props.children
  }
}

export default function SkillIcon({ skill, className = '', onRatio }) {
  const kind = skill?.iconKind || 'class'
  const [failed, setFailed] = useState(false)

  useEffect(() => { setFailed(false) }, [skill?.icon, skill?.iconSvg, kind])

  useEffect(() => {
    if (kind !== 'svg-paste' || !skill?.iconSvg || !onRatio) return
    const box = String(skill.iconSvg).match(/viewBox=["']([\d.\s-]+)["']/i)
    if (!box) return
    const parts = box[1].trim().split(/[\s,]+/).map(Number)
    if (parts.length === 4 && parts[3]) onRatio(parts[2] / parts[3])
  }, [kind, skill?.iconSvg, onRatio])

  function report(width, height) {
    if (!onRatio || !width || !height) return
    onRatio(width / height)
  }

  if (failed) return null

  const classNameValue = kind === 'class' ? skill?.icon : (!String(skill?.iconSvg || '').includes('<') && String(skill?.iconSvg || '').includes(':') ? skill.iconSvg : '')
  if (classNameValue) {
    const src = iconifyUrl(classNameValue)
    if (!src) return null
    return (
      <IconGuard>
        <img
          src={src}
          alt=""
          className={className}
          onLoad={(event) => report(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight)}
          onError={() => setFailed(true)}
        />
      </IconGuard>
    )
  }

  if (kind === 'svg-paste' && skill?.iconSvg?.includes('<')) {
    return (
      <span
        className={`${className} skill-chip-svg`}
        aria-hidden
        dangerouslySetInnerHTML={{ __html: safeSvg(skill.iconSvg) }}
      />
    )
  }

  if ((kind === 'svg-file' || kind === 'png' || (!kind && skill?.icon?.startsWith('/'))) && skill?.icon) {
    return (
      <img
        src={resolveMediaUrl(skill.icon)}
        alt=""
        className={className}
        onLoad={(event) => report(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight)}
        onError={() => setFailed(true)}
      />
    )
  }

  return null
}
