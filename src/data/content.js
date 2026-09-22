/**
 * Edita este archivo para personalizar tu portafolio.
 * Los enlaces sociales y del formulario se pueden conectar después.
 */

export const profile = {
  name: 'Daniel de León',
  role: 'Desarrollador Web',
  location: 'Guatemala',
  tagline:
    'Construyo interfaces rápidas, limpias y con atención al detalle. De la idea al deploy.',
  email: 'hola@danieldelon.dev', // cámbialo por tu email real
  availability: 'Disponible para proyectos freelance y full-time',
  heroButtons: [
    { label: 'Ver trabajo', href: '#projects', style: 'filled', openInNewTab: false },
    { label: 'Contactar', href: '#contact', style: 'outline', openInNewTab: false },
  ],
  socials: {
    github: 'https://github.com/', // agrega tu usuario
    linkedin: 'https://linkedin.com/in/', // agrega tu perfil
    twitter: 'https://x.com/', // opcional
  },
}

export const about = {
  paragraphs: [
    'Soy desarrollador web de Guatemala. Me enfoco en crear productos digitales claros, performantes y fáciles de mantener — con stack moderno y una estética minimalista.',
    'Disfruto transformar requisitos en experiencias de usuario fluidas: componentes reutilizables, animaciones sutiles y un código legible. Me interesa tanto el frontend como el backend cuando el proyecto lo pide.',
    'Fuera del código, sigo aprendiendo, revisando open source y puliendo detalles que marcan la diferencia en un producto real.',
  ],
  highlights: [
    { label: 'Años de experiencia', value: '3+' },
    { label: 'Proyectos entregados', value: '20+' },
    { label: 'Stack principal', value: 'React' },
    { label: 'Base', value: 'GT' },
  ],
}

export const sectionHeaders = {
  about: {
    eyebrow: 'Sobre mí',
    title: 'Diseño en código. Productos que se sienten vivos.',
    description: 'Más que un CV en una página: cómo pienso y construyo.',
  },
  skills: {
    eyebrow: 'Skills',
    title: 'Stack que uso de verdad',
    description: 'No es una lista genérica: categorías con chips animados al estilo de un OS moderno.',
  },
  experience: {
    eyebrow: 'Experiencia',
    title: 'Trayectoria en capas',
    description: 'Acordeón con layout animado — abre cada etapa para ver el detalle.',
  },
  projects: {
    eyebrow: 'Portafolio',
    title: 'Proyectos en 3D sutil',
    description: 'Cards con tilt al cursor y spotlight — reemplaza demos y repos por los tuyos.',
  },
  contact: {
    eyebrow: 'Contacto',
    title: 'Empecemos algo nuevo',
    description: 'Formulario listo para cablear. Mientras tanto, simula el envío en el cliente.',
  },
}

export const skills = {
  categories: [
    {
      title: 'Frontend',
      items: [
        'React',
        'TypeScript',
        'Next.js',
        'Vite',
        'Tailwind CSS',
        'Framer Motion',
        'HTML / CSS',
        'Responsive Design',
      ],
    },
    {
      title: 'Backend & Datos',
      items: [
        'Node.js',
        'Express',
        'REST APIs',
        'PostgreSQL',
        'MongoDB',
        'Prisma',
        'Auth (JWT / OAuth)',
      ],
    },
    {
      title: 'Herramientas & DevOps',
      items: [
        'Git / GitHub',
        'Vercel',
        'Docker',
        'CI/CD',
        'Figma',
        'Testing (Vitest)',
        'npm / pnpm',
      ],
    },
    {
      title: 'Prácticas',
      items: [
        'UI/UX',
        'Performance',
        'Accesibilidad',
        'Clean Code',
        'Component Design',
        'SEO básico',
      ],
    },
  ],
}

export const experience = [
  {
    company: 'Freelance / Proyectos independientes',
    role: 'Desarrollador Web',
    period: '2023 — Presente',
    location: 'Remoto · Guatemala',
    description:
      'Diseño y desarrollo de sitios y aplicaciones web para clientes: landing pages, dashboards y MVPs con React, APIs y despliegue en Vercel.',
    highlights: [
      'Entrega de productos end-to-end (UI, API, deploy)',
      'Enfoque en performance, UX y código mantenible',
      'Comunicación clara con clientes y plazos realistas',
    ],
  },
  {
    company: 'Proyecto / Startup (placeholder)',
    role: 'Frontend Developer',
    period: '2022 — 2023',
    location: 'Guatemala',
    description:
      'Desarrollo de interfaces con React, integración de APIs y colaboración con diseño para lanzar features de forma iterativa.',
    highlights: [
      'Componentes reutilizables y design system ligero',
      'Mejora de tiempos de carga y experiencia móvil',
      'Code reviews y buenas prácticas en el equipo',
    ],
  },
  {
    company: 'Primeros proyectos / Aprendizaje',
    role: 'Desarrollador Junior',
    period: '2021 — 2022',
    location: 'Guatemala',
    description:
      'Construcción de bases sólidas en JavaScript, HTML/CSS y frameworks modernos. Primeros clientes y proyectos open source.',
    highlights: [
      'Dominio de fundamentos web y Git',
      'Primeros deploys y dominios personalizados',
    ],
  },
]

export const projects = [
  {
    title: 'Dashboard SaaS',
    description:
      'Panel de administración con autenticación, tablas, filtros y gráficos. UI minimalista y datos en tiempo real vía API.',
    tags: ['React', 'TypeScript', 'Tailwind', 'Node.js'],
    year: '2025',
    link: '#',
    github: '#',
    featured: true,
  },
  {
    title: 'E-commerce moderno',
    description:
      'Tienda online con catálogo, carrito, checkout y panel de productos. Optimizado para móvil y SEO.',
    tags: ['Next.js', 'Stripe', 'PostgreSQL'],
    year: '2024',
    link: '#',
    github: '#',
    featured: true,
  },
  {
    title: 'Landing de producto',
    description:
      'Página de marketing de alto rendimiento con animaciones sutiles, secciones convertibles y formulario de leads.',
    tags: ['Vite', 'React', 'Framer Motion'],
    year: '2024',
    link: '#',
    github: '#',
    featured: false,
  },
  {
    title: 'API + App de tareas',
    description:
      'CRUD completo con autenticación JWT, estados de carga y diseño limpio. Ideal como base de productividad.',
    tags: ['Express', 'MongoDB', 'React'],
    year: '2023',
    link: '#',
    github: '#',
    featured: false,
  },
]

export const navLinks = [
  { href: '#about', label: 'Sobre mí' },
  { href: '#skills', label: 'Skills' },
  { href: '#experience', label: 'Experiencia' },
  { href: '#projects', label: 'Proyectos' },
  { href: '#contact', label: 'Contacto' },
]
