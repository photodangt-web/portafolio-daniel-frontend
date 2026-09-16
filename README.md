# Daniel de León — Portfolio

Portafolio minimalista de desarrollador web. Estética blanco / negro / grises (tipo Vercel), animaciones con Framer Motion.

## Stack

- React 19 + Vite
- Tailwind CSS v4
- Framer Motion
- Lucide React (iconos)
- React Router DOM
- React Hook Form + Zod

## Cómo correrlo

```bash
cd ~/daniel-portfolio
npm install
npm run dev
```

Abre la URL que muestre Vite (normalmente `http://localhost:5173`).

## Administración

1. Copia `.env.example` a `.env` si necesitas cambiar la API. Por defecto usa `http://localhost:7070/api/v1`.
2. Inicia el backend de API en el puerto `7070` y después ejecuta `npm run dev`.
3. Abre `http://localhost:5173/login` e inicia sesión con una cuenta que tenga el rol `admin`.

El panel protegido está en `/admin`. Incluye edición de perfil, medios locales, skills, experiencia, educación y proyectos. La sesión usa cookies HTTP-only para refresh y mantiene el access token sólo en memoria. Los medios aceptan JPEG, PNG, WebP y GIF (máximo 10 MB).

```bash
npm run lint
npm run build
```

## Personalizar

Edita **`src/data/content.js`** para cambiar:

- Nombre, email, redes
- About, skills, experiencia
- Proyectos y enlaces

## Formulario de contacto

El formulario está en `src/components/Contact.jsx`. Hoy simula el envío en el cliente. Para conectarlo después:

1. **Formspree** — descomenta el `fetch` de ejemplo y pon tu form ID
2. **EmailJS** / **Resend** / tu propia API

## Build de producción

```bash
npm run build
npm run preview
```
