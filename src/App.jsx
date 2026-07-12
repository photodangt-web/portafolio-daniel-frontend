import { ThemeProvider } from './context/ThemeContext'
import Atmosphere from './components/Atmosphere'
import Dock from './components/Dock'
import Hero from './components/Hero'
import About from './components/About'
import Skills from './components/Skills'
import Experience from './components/Experience'
import Projects from './components/Projects'
import Contact from './components/Contact'
import Footer from './components/Footer'

export default function App() {
  return (
    <ThemeProvider>
      <div className="relative min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--fg)]">
        <Atmosphere />
        <main className="relative z-10">
          <Hero />
          <About />
          <Skills />
          <Experience />
          <Projects />
          <Contact />
        </main>
        <Footer />
        <Dock />
      </div>
    </ThemeProvider>
  )
}
