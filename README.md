# Daniel de León — Portfolio

Portafolio minimalista de desarrollador web. Estética blanco / negro / grises (tipo Vercel), animaciones con Framer Motion.

## Stack

- React 19 + Vite
- Tailwind CSS v4
- Framer Motion
- Lucide React (iconos)

## Cómo correrlo

```bash
cd ~/daniel-portfolio
npm install
npm run dev
```

Abre la URL que muestre Vite (normalmente `http://localhost:5173`).

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
