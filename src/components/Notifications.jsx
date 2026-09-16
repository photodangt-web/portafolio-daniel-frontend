import { Toaster } from 'sonner'
import { useTheme } from '../context/ThemeContext.jsx'

export default function Notifications() {
  const { theme } = useTheme()

  return <Toaster position="top-right" theme={theme} richColors toastOptions={{ classNames: { toast: 'border border-[var(--border)] bg-[var(--bg-card)] text-[var(--fg)]', success: 'border-emerald-500/40 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100', error: 'border-red-500/40 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100', warning: 'border-amber-500/40 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100', info: 'border-sky-500/40 bg-sky-50 text-sky-900 dark:bg-sky-950 dark:text-sky-100' } }} />
}
