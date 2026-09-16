import { Component, lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Atmosphere from './components/Atmosphere'
import Dock from './components/Dock'
import Hero from './components/Hero'
import About from './components/About'
import Skills from './components/Skills'
import Experience from './components/Experience'
import Projects from './components/Projects'
import Contact from './components/Contact'
import Footer from './components/Footer'
import { about, experience, profile, projects, skills } from './data/content'
import { adaptExperience, adaptProfile, adaptProjects, adaptSkills } from './api/adapters'
import {
  useExperienceQuery,
  useProfileQuery,
  useProjectsQuery,
  useSkillsQuery,
} from './api/hooks'
import Login from './admin/Login'
import AdminLayout from './admin/AdminLayout'
import AdminHome from './admin/AdminHome'
import AdminContent from './admin/AdminContent'
import RequireAdmin from './auth/RequireAdmin'

const Blog = lazy(() => import('./blog/Blog'))
const Article = lazy(() => import('./blog/Article'))
const AdminBlogList = lazy(() => import('./admin/AdminBlog').then((module) => ({ default: module.AdminBlogList })))
const AdminBlogEditor = lazy(() => import('./admin/AdminBlog').then((module) => ({ default: module.AdminBlogEditor })))
const AdminTaxonomies = lazy(() => import('./admin/AdminBlog').then((module) => ({ default: module.AdminTaxonomies })))
const AnalyticsOverview = lazy(() => import('./admin/AdminAnalytics').then((module) => ({ default: module.AnalyticsOverview })))
const AnalyticsDetail = lazy(() => import('./admin/AdminAnalytics').then((module) => ({ default: module.AnalyticsDetail })))

class RouteErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <main className="grid min-h-screen place-items-center bg-[var(--bg)] p-6 text-[var(--fg)]"><p role="alert">No fue posible cargar esta página. Recarga e inténtalo de nuevo.</p></main>
    }
    return this.props.children
  }
}

function Portfolio() {
  const profileQuery = useProfileQuery()
  const skillsQuery = useSkillsQuery()
  const experienceQuery = useExperienceQuery()
  const projectsQuery = useProjectsQuery()
  const remoteProfile = profileQuery.data ? adaptProfile(profileQuery.data) : null
  const portfolioProfile = remoteProfile ? { ...profile, ...remoteProfile } : profile
  const portfolioAbout = remoteProfile?.about || about
  const remoteSkills = skillsQuery.data?.length ? adaptSkills(skillsQuery.data) : null
  const portfolioSkills = remoteSkills?.categories?.length ? remoteSkills : skills
  const portfolioExperience = experienceQuery.data?.length
    ? adaptExperience(experienceQuery.data)
    : experience
  const portfolioProjects = projectsQuery.data?.length ? adaptProjects(projectsQuery.data) : projects
  const queries = [profileQuery, skillsQuery, experienceQuery, projectsQuery]
  const isLoading = queries.some((query) => query.isLoading)
  const hasError = queries.some((query) => query.isError)

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--fg)]">
      <Atmosphere />
      {(isLoading || hasError) && (
        <p
          className="pointer-events-none fixed right-4 top-4 z-50 rounded-full border border-[var(--border)] bg-[var(--bg-card)]/85 px-3 py-1.5 text-[10px] text-[var(--fg-faint)] backdrop-blur"
          role="status"
        >
          {isLoading ? 'Actualizando contenido...' : 'Mostrando contenido disponible'}
        </p>
      )}
      <main className="relative z-10">
        <Hero profile={portfolioProfile} />
        <About profile={portfolioProfile} about={portfolioAbout} />
        <Skills skills={portfolioSkills} />
        <Experience experience={portfolioExperience} />
        <Projects projects={portfolioProjects} />
        <Contact profile={portfolioProfile} />
      </main>
      <Footer profile={portfolioProfile} />
      <Dock />
    </div>
  )
}

export default function App() {
  return (
    <RouteErrorBoundary><Suspense fallback={null}><Routes>
      <Route path="/" element={<Portfolio />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<Article />} />
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAdmin />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminHome />} />
          <Route path="perfil" element={<AdminContent section="perfil" />} />
          <Route path="skills" element={<AdminContent section="skills" />} />
          <Route path="experiencia" element={<AdminContent section="experiencia" />} />
          <Route path="educacion" element={<AdminContent section="educacion" />} />
           <Route path="proyectos" element={<AdminContent section="proyectos" />} />
           <Route path="blog" element={<AdminBlogList />} />
           <Route path="blog/categorias" element={<AdminTaxonomies />} />
           <Route path="blog/nuevo" element={<AdminBlogEditor />} />
           <Route path="blog/:id" element={<AdminBlogEditor />} />
           <Route path="medios" element={<AdminContent section="medios" />} />
           <Route path="analytics" element={<AnalyticsOverview />} />
           <Route path="analytics/detalle" element={<AnalyticsDetail />} />
        </Route>
      </Route>
      <Route path="*" element={<Portfolio />} />
    </Routes></Suspense></RouteErrorBoundary>
  )
}
