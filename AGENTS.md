<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Learning to Fly Academy — Plataforma de Inglés Online

Plataforma de aprendizaje de inglés con profesores reales, clases individuales y seguimiento de progreso. Mercados iniciales: Argentina y España. Producto real orientado a producción — no demos.

**Documentación obligatoria antes de implementar:**
- `docs/00-arquitectura.md` — decisiones técnicas, estructura, riesgos
- `docs/01-modelo-de-datos.md` — esquema, relaciones, políticas RLS
- `docs/02-plan-de-implementacion.md` — fases y criterios de salida
- `docs/03-setup.md` — pasos para configurar Supabase y correr el proyecto

## Estado actual

Fases 0-5 construidas: arquitectura, fundaciones (auth + roles + migraciones RLS), landing, área del alumno (onboarding, reserva/cancelación de clases, progreso, materiales, perfil), panel del profesor (agenda, alumnos, notas privadas, disponibilidad) y panel admin (métricas, usuarios/roles, asignación de profesor, clases, planes). Pendiente: Fase 6 (pagos MP/Stripe), Fase 7 (IA), Fase 8 (escala). El usuario aún debe crear el proyecto Supabase y aplicar las 3 migraciones (`docs/03-setup.md`).

Política de clases (en `src/lib/services/policy.ts`): reserva con ≥12 h de anticipación, cancelación gratuita hasta 24 h antes, ventana de reserva de 14 días, clases de 50 min.

## Stack

Next.js (App Router) + TypeScript strict + Tailwind v4 + shadcn/ui + Supabase (Postgres/Auth/RLS/Storage) + Vercel. Validación con Zod (esquemas compartidos en `src/lib/validators/`). Pagos futuros: Mercado Pago (AR) y Stripe (ES) detrás de la interfaz `PaymentProvider`.

## Reglas de trabajo

1. Antes de cada módulo: explicar qué se construye, qué archivos se tocan, impacto en DB y seguridad. Después: validar (`npm run typecheck`, `npm run lint`) y corregir.
2. Mobile-first: diseñar para 375px primero.
3. Capas: `app/ → components/ → lib/services/ → lib/supabase/`. Los componentes no llaman a Supabase directo; la lógica de negocio vive en `lib/services/`, no en componentes.
4. Seguridad: RLS en toda tabla nueva (en la misma migración), verificación de rol en servidor en toda Server Action, nunca confiar en el frontend, `SUPABASE_SERVICE_ROLE_KEY` solo en servidor.
5. Fechas siempre en UTC (`timestamptz`); conversión a TZ del usuario solo al renderizar.
6. Esquema de DB solo por migraciones en `supabase/migrations/`, nunca a mano en el dashboard.
7. Textos de UI en español vía `messages/es.json`, no hardcodeados en componentes.
8. No sobrearquitecturar, no duplicar lógica, no crear componentes gigantes ni archivos innecesarios. No modificar archivos no relacionados.
9. Transparencia como principio de producto: el alumno siempre puede ver plan, precio, renovación y cancelar sin contactar soporte.

## Marca

Nombre: **Learning to Fly Academy**. Logo: avión de papel ascendente (`src/components/brand/logo.tsx`, `src/app/icon.svg`). Tono: premium pero cercano, profesional, sin infantilismos.

## Comandos

- `npm run dev` — desarrollo
- `npm run build` — build de producción
- `npm run lint` — ESLint
- `npm run typecheck` — `tsc --noEmit`
