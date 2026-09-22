import { motion, useReducedMotion } from 'framer-motion'

export function Reveal({ show = true, delay = 0, children, className = '' }) {
  const reduced = useReducedMotion()
  if (reduced) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, filter: 'blur(10px)' }}
      animate={show ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(8px)' }}
      transition={{ duration: show ? 0.95 : 0.35, delay: show ? delay : 0, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

export function FadeWords({ text = '', show = true, delay = 0, as: Tag = 'p', className = '', tone = 'copy' }) {
  const reduced = useReducedMotion()
  if (reduced || !text) return <Tag className={className}>{text}</Tag>

  const ease = [0.16, 1, 0.3, 1]

  if (tone !== 'title') {
    return (
      <motion.div
        initial={{ opacity: 0, filter: 'blur(8px)' }}
        animate={show ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(6px)' }}
        transition={{ duration: show ? 1.35 : 0.35, delay: show ? delay : 0, ease }}
      >
        <Tag className={className}>{text}</Tag>
      </motion.div>
    )
  }

  return (
    <Tag className={className}>
      {String(text).split(' ').map((word, index, list) => (
        <motion.span
          key={`${word}-${index}`}
          className="project-fade-word"
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={show ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(6px)' }}
          transition={{
            duration: show ? 1.25 : 0.35,
            delay: show ? delay + index * 0.11 : 0,
            ease,
          }}
        >
          {word}{index < list.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </Tag>
  )
}

export default function Sweep({ children, show = true, delay = 0, className = '' }) {
  const reduced = useReducedMotion()
  if (reduced) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: show ? 1 : 0.28 }}
      transition={{ duration: 0.85, delay: show ? delay : 0, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
