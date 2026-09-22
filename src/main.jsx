import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Notifications from './components/Notifications.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { AuthProvider } from './auth/AuthContext.jsx'
import { AnalyticsProvider } from './analytics/AnalyticsProvider.jsx'


const queryClient = new QueryClient()

// Apply theme before paint to avoid flash
;(() => {
  try {
    const stored = localStorage.getItem('portfolio-theme')
    const dark =
      stored === 'dark' ||
      (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)
    if (dark) document.documentElement.classList.add('dark')
  } catch {
    /* ignore */
  }
})()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Notifications />
        <AuthProvider>
          <BrowserRouter>
            <AnalyticsProvider>
              <App />
            </AnalyticsProvider>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
