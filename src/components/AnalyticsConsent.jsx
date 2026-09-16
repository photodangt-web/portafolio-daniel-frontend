import { useAnalytics } from '../analytics/AnalyticsProvider'

export default function AnalyticsConsent() {
  const { consent, setConsent } = useAnalytics()
  if (consent !== 'unknown') return null
  return <div className="fixed bottom-4 left-4 z-50 max-w-sm rounded-xl border border-[var(--border)] bg-[var(--bg-card)]/95 p-3 text-xs shadow-xl backdrop-blur"><p className="text-[var(--fg-muted)]">Usamos métricas anónimas para mejorar este sitio. No almacenamos tu IP.</p><div className="mt-2 flex gap-2"><button onClick={() => setConsent('granted')} className="rounded-lg bg-[var(--accent)] px-3 py-1.5 font-medium text-[var(--accent-fg)]">Aceptar</button><button onClick={() => setConsent('denied')} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-[var(--fg-muted)]">No participar</button></div></div>
}
