# Directrices de Desarrollo Frontend - Alma Lectora Client

## 1. Stack Tecnológico Estricto
* Framework: React (Vite) con TypeScript en Modo Estricto.
* Gestión de Estado y Servidor: TanStack React Query (para caching e invalidación de datos) + Axios.
* Estilos: Tailwind CSS (Diseño limpio, enfocado en lectura, paleta de colores del emprendimiento, responsive).
* Formularios: React Hook Form acoplado con validación Zod (esencial para la carga de libros y validación de formularios).

## 2. Reglas de Negocio Core (Catálogo & API)
* El frontend consume la API del backend bajo la estructura modular serverless en Vercel.
* Gestión de Sesión: Autenticación segura para el panel de administración/configuración del emprendimiento.
* No se permiten llamadas directas con fetch nativo; usar la instancia configurada de Axios que maneja los encabezados y peticiones al backend.
* Manejo de Portadas: Las imágenes del catálogo deben renderizarse prioritariamente en formato WebP para optimizar el rendimiento de la red y reducir los megabytes transferidos. Soporte híbrido para URLs públicas de Supabase Storage (libros escaneados) y URLs externas de internet.

## 3. Arquitectura de Carpetas (Clean Architecture / Feature-First)

Todo componente debe ser modular y altamente cohesivo:
src/
├── assets/         # Pack de íconos completo generado para web, Android e iOS
├── components/     # Componentes atómicos globales (Botones, inputs, tarjetas de libros, Navbar)
├── context/        # Estados globales compartidos (Auth para administración, UI Theme)
├── features/       # Módulos de negocio (auth, catalogo, pedidos, config)
│   └── catalogo/
│       ├── components/  # Formularios de alta de libros, grilla de portadas, buscador
│       ├── hooks/       # Custom hooks para Queries y Mutations de TanStack (Fetch de libros)
│       └── pages/       # Vistas de la feature (CatalogoPage, LibroDetailPage)
├── hooks/          # Hooks globales reusables
├── routes/         # Definición jerárquica de rutas (Catálogo Público vs Panel de Admin Protegido)
└── services/       # Clientes de API e interceptores de Axios

## Package Manager

This project exclusively uses pnpm.
Rules:
- Never use npm.
- Never use commands with npm.
- Always use pnpm.
- If you need to install dependencies, use `pnpm add`.
- If you need to install development dependencies, use `pnpm add -D`.
- To run scripts, use `pnpm dev`, `pnpm build`, `pnpm test`, etc.
- If the project does not yet have pnpm installed, please indicate this before proceeding.