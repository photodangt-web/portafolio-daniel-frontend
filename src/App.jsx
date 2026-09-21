import { Component, lazy, Suspense, useEffect, useMemo } from 'react'
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
import { about, experience, profile, projects, sectionHeaders, skills } from './data/content'
import { readHomeSnapshot, writeHomeSnapshot } from './api/homeSnapshot'
import { adaptExperience, adaptProfile, adaptProjects, adaptSectionHeaders, adaptSkills } from './api/adapters'
import {
  useExperienceQuery,
  useProfileQuery,
  useProjectsQuery,
  useSectionHeadersQuery,
  useSkillsQuery,
} from './api/hooks'
import Login from './admin/Login'
import AdminLayout from './admin/AdminLayout'
import AdminHome from './admin/AdminHome'
import AdminContent from './admin/AdminContent'
import RequireAdmin from './auth/RequireAdmin'

const Blog = lazy(() => import('./blog/Blog'))
const Article = lazy(() => import('./blog/Article'))
const ProjectShowcase = lazy(() => import('./projects/ProjectShowcase'))
const LegacyProjectRedirect = lazy(() => import('./projects/ProjectShowcase').then((module) => ({ default: module.LegacyProjectRedirect })))
const AdminBlogList = lazy(() => import('./admin/AdminBlog').then((module) => ({ default: module.AdminBlogList })))
const AdminBlogEditor = lazy(() => import('./admin/AdminBlog').then((module) => ({ default: module.AdminBlogEditor })))
const AdminTaxonomies = lazy(() => import('./admin/AdminBlog').then((module) => ({ default: module.AdminTaxonomies })))
const AnalyticsOverview = lazy(() => import('./admin/AdminAnalytics').then((module) => ({ default: module.AnalyticsOverview })))
const AnalyticsDetail = lazy(() => import('./admin/AdminAnalytics').then((module) => ({ default: module.AnalyticsDetail })))
const LeadsList = lazy(() => import('./admin/AdminLeads').then((module) => ({ default: module.LeadsList })))
const LeadDetailPage = lazy(() => import('./admin/AdminLeads').then((module) => ({ default: module.LeadDetailPage })))
const LeadFieldsSettings = lazy(() => import('./admin/AdminLeads').then((module) => ({ default: module.LeadFieldsSettings })))
const LeadWebhookSettings = lazy(() => import('./admin/AdminLeads').then((module) => ({ default: module.LeadWebhookSettings })))

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
  const snapshot = useMemo(() => readHomeSnapshot(), [])
  const profileQuery = useProfileQuery()
  const skillsQuery = useSkillsQuery()
  const experienceQuery = useExperienceQuery()
  const projectsQuery = useProjectsQuery()
  const sectionHeadersQuery = useSectionHeadersQuery()
  const profileData = profileQuery.data || snapshot.profile
  const skillsData = skillsQuery.data?.length ? skillsQuery.data : snapshot.skills
  const experienceData = experienceQuery.data?.length ? experienceQuery.data : snapshot.experience
  const projectsData = projectsQuery.data?.length ? projectsQuery.data : snapshot.projects
  const headersData = sectionHeadersQuery.data || snapshot.sectionHeaders
  const remoteProfile = profileData ? adaptProfile(profileData) : null
  const portfolioProfile = remoteProfile ? { ...profile, ...remoteProfile } : profile
  const remoteHeaders = adaptSectionHeaders(headersData)
  const headers = Object.fromEntries(
    Object.entries(sectionHeaders).map(([key, value]) => [
      key,
      { ...value, ...(remoteHeaders[key] || {}) },
    ]),
  )
  const portfolioAbout = remoteProfile?.about || about
  const remoteSkills = skillsData?.length ? adaptSkills(skillsData) : null
  const portfolioSkills = remoteSkills?.categories?.length ? remoteSkills : skills
  const portfolioExperience = experienceData?.length ? adaptExperience(experienceData) : experience
  const portfolioProjects = projectsData?.length ? adaptProjects(projectsData) : projects
  const queries = [profileQuery, skillsQuery, experienceQuery, projectsQuery, sectionHeadersQuery]
  const isLoading = queries.some((query) => query.isLoading)

  useEffect(() => {
    if (isLoading) return
    const live = queries.every((query) => query.isSuccess && query.data)
    console.log(live ? 'content: server' : 'content: static_front')
  }, [isLoading, profileQuery.status, skillsQuery.status, experienceQuery.status, projectsQuery.status, sectionHeadersQuery.status])

  useEffect(() => {
    if (!profileQuery.data || !skillsQuery.data || !experienceQuery.data || !projectsQuery.data || !sectionHeadersQuery.data) return
    writeHomeSnapshot({
      syncedAt: new Date().toISOString(),
      profile: profileQuery.data,
      skills: skillsQuery.data,
      experience: experienceQuery.data,
      projects: projectsQuery.data,
      sectionHeaders: sectionHeadersQuery.data,
    })
  }, [profileQuery.data, skillsQuery.data, experienceQuery.data, projectsQuery.data, sectionHeadersQuery.data])

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--fg)]">
      <Atmosphere />
      <main className="relative z-10">
        <Hero profile={portfolioProfile} />
        <About profile={portfolioProfile} about={portfolioAbout} header={headers.about} />
        <Skills skills={portfolioSkills} header={headers.skills} />
        <Experience experience={portfolioExperience} header={headers.experience} />
        <Projects projects={portfolioProjects} header={headers.projects} />
        <Contact profile={portfolioProfile} header={headers.contact} />
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
      <Route path="/proyectos/:slug" element={<ProjectShowcase />} />
      <Route path="/projects/:slug" element={<LegacyProjectRedirect />} />
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
            <Route path="leads" element={<LeadsList />} />
            <Route path="leads/:id" element={<LeadDetailPage />} />
            <Route path="leads/formulario" element={<LeadFieldsSettings />} />
           <Route path="leads/settings" element={<LeadWebhookSettings />} />
           <Route path="analytics" element={<AnalyticsOverview />} />
           <Route path="analytics/detalle" element={<AnalyticsDetail />} />
        </Route>
      </Route>
      <Route path="*" element={<Portfolio />} />
    </Routes></Suspense></RouteErrorBoundary>
  )
}
