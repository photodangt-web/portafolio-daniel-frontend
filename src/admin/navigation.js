import {
  BriefcaseBusiness,
  BookOpen,
  FolderKanban,
  GraduationCap,
  Image,
  ChartNoAxesCombined,
  Sparkles,
  UserRound,
} from 'lucide-react'

export const adminNavigation = [
  { label: 'Perfil', path: 'perfil', icon: UserRound, group: 'Contenido' },
  { label: 'Skills', path: 'skills', icon: Sparkles, group: 'Contenido' },
  { label: 'Experiencia', path: 'experiencia', icon: BriefcaseBusiness, group: 'Contenido' },
  { label: 'Educación', path: 'educacion', icon: GraduationCap, group: 'Contenido' },
  { label: 'Proyectos', path: 'proyectos', icon: FolderKanban, group: 'Contenido' },
  { label: 'Blog', path: 'blog', icon: BookOpen, group: 'Contenido' },
  { label: 'Categorías y tags', path: 'blog/categorias', icon: BookOpen, group: 'Contenido' },
  { label: 'Medios', path: 'medios', icon: Image, group: 'Contenido' },
  { label: 'Analytics', path: 'analytics', icon: ChartNoAxesCombined, group: 'Analítica' },
]
