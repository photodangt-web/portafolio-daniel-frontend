import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion'
import {
  User,
  Code2,
  Briefcase,
  Layers,
  Mail,
  Sun,
  Moon,
  Home,
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useLocation } from 'react-router-dom'

const items = [
  { id: 'top', href: '#top', label: 'Inicio', Icon: Home },
  { id: 'about', href: '#about', label: 'Sobre mí', Icon: User },
  { id: 'skills', href: '#skills', label: 'Skills', Icon: Code2 },
  { id: 'experience', href: '#experience', label: 'Experiencia', Icon: Briefcase },
  { id: 'projects', href: '#projects', label: 'Proyectos', Icon: Layers },
  { id: 'contact', href: '#contact', label: 'Contacto', Icon: Mail },
]

function DockIcon({ item, mouseX, active }) {
  const ref = useRef(null)
  const [hovered, setHovered] = useState(false)

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    return val - bounds.x - bounds.width / 2
  })

  const sizeSync = useTransform(distance, [-120, 0, 120], [44, 68, 44])
  const size = useSpring(sizeSync, { mass: 0.15, stiffness: 220, damping: 14 })

  return (
    <div
      className="relative flex flex-col items-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <AnimatePresence>
        {hovered && (
          <motion.span
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className="pointer-events-none absolute -top-10 whitespace-nowrap rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1 text-[11px] font-medium text-[var(--fg)] shadow-lg"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>

      <motion.a
        ref={ref}
        href={item.href}
        style={{ width: size, height: size }}
        className="dock-item relative flex items-center justify-center rounded-2xl"
        whileTap={{ scale: 0.88 }}
        aria-label={item.label}
      >
        <span
          className={`flex h-full w-full items-center justify-center rounded-2xl border transition-colors duration-300 ${active
              ? 'border-[var(--border-strong)] bg-[var(--fg)] text-[var(--accent-fg)] shadow-lg'
              : 'border-[var(--border)] bg-[var(--bg-card)]/80 text-[var(--fg)] hover:bg-[var(--bg-soft)]'
            }`}
        >
          <item.Icon
            size={active ? 20 : 18}
            strokeWidth={1.75}
            className="transition-transform duration-200"
          />
        </span>
        {active && (
          <motion.span
            layoutId="dock-dot"
            className="absolute -bottom-2 h-1 w-1 rounded-full bg-[var(--fg)]"
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          />
        )}
      </motion.a>
    </div>
  )
}

export default function Dock({ variant = 'floating', placement = 'bottom' }) {
  const location = useLocation()
  const { theme, toggle } = useTheme()
  const mouseX = useMotionValue(Infinity)
  const [active, setActive] = useState('top')
  const [visible, setVisible] = useState(true)
  const lastScroll = useRef(0)

  useEffect(() => {
    const sections = ['top', 'about', 'skills', 'experience', 'projects', 'contact']

    const onScroll = () => {
      const y = window.scrollY
      // slight hide on fast scroll down (mac-like)
      if (y > lastScroll.current + 40 && y > 200) setVisible(false)
      else if (y < lastScroll.current - 10) setVisible(true)
      lastScroll.current = y

      let current = 'top'
      for (const id of sections) {
        const el = document.getElementById(id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= window.innerHeight * 0.35) {
          current = id
        }
      }
      setActive(current)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isTopOnDesktop = placement === 'responsive-top'
  const position = isTopOnDesktop
    ? 'bottom-5 md:bottom-auto md:top-7'
    : 'bottom-5 md:bottom-7'
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: visible ? 0 : 90, opacity: visible ? 1 : 0.4 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className={`pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4 ${position}`}
    >
      <motion.nav
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className={`pointer-events-auto flex items-end gap-1.5 rounded-[1.75rem] glass-strong px-2.5 py-2 md:gap-2 md:px-3 md:py-2.5 dock--${variant}`}
        aria-label="Navegación principal"
      >
        {items.map((item) => (
          <DockIcon
            key={item.id}
            item={{ ...item, href: location.pathname === '/' ? item.href : `/${item.href}` }}
            mouseX={mouseX}
            active={active === item.id}
          />
        ))}

        <div className="mx-1 h-10 w-px self-center bg-[var(--border-strong)]" />

        <motion.button
          type="button"
          onClick={toggle}
          whileHover={{ scale: 1.12, y: -6 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
          className="relative mb-0 flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/80 text-[var(--fg)] transition-colors hover:bg-[var(--bg-soft)] md:h-12 md:w-12"
          aria-label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={theme}
              initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.25 }}
              className="flex"
            >
              {theme === 'dark' ? <Sun size={18} strokeWidth={1.75} /> : <Moon size={18} strokeWidth={1.75} />}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </motion.nav>
    </motion.div>
  )
}
