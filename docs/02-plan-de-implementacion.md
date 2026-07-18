# Plan de Implementación

> FASE 0 — Orden de construcción propuesto. Cada fase termina con la app desplegable y funcionando; no se avanza con fases a medio cerrar.

## Fase 1 — Fundaciones

Objetivo: proyecto desplegable con auth completa y roles funcionando.

1. **Scaffold**: Next.js + TypeScript (strict) + Tailwind + shadcn/ui + ESLint/Prettier. Estructura de carpetas de `00-arquitectura.md`.
2. **Supabase**: proyecto, primera migración (enums + `profiles` + trigger de creación de perfil + sync de rol a JWT), tipos generados.
3. **Auth**: registro, login, logout, recuperación de contraseña, verificación de email. Middleware con refresh de sesión y protección de rutas por rol.
4. **Migración 2**: resto de tablas académicas y comerciales + RLS completo + seed de desarrollo.
5. **Base de UI**: layout raíz mobile-first, tema (tipografía, paleta, espaciado), componentes primitivos.
6. Deploy a Vercel desde el día uno (preview + producción).

Criterio de salida: un usuario se registra, verifica email, entra y es redirigido según su rol; RLS verificado con tests SQL básicos.

## Fase 2 — Landing

Home (propuesta de valor), cómo funciona, profesores, planes (leyendo la tabla `plans`), FAQ, contacto, footer, páginas legales (términos, privacidad, política de cancelación — **transparencia como principio**). SEO básico + Open Graph.

## Fase 3 — Alumno

⚠️ **Bloqueante previo**: definir las reglas de negocio de cancelación/reprogramación/ausencia (ver riesgos en `00-arquitectura.md`).

1. Onboarding por pasos (corto, visual): datos → nivel estimado → objetivo → disponibilidad → meta.
2. Dashboard: próxima clase, profesor, nivel, objetivo, progreso, tareas pendientes.
3. Reserva de clases contra disponibilidad real del profesor (servicio de scheduling + constraint anti-solape).
4. Historial de clases, materiales, perfil, vista de progreso.

## Fase 4 — Profesor

Agenda (semana/día en su TZ), lista de alumnos, ficha del alumno (nivel, objetivo, historial), notas privadas, registro de progreso, tareas, gestión de disponibilidad.

## Fase 5 — Administración

Dashboard de métricas base, gestión de usuarios/roles, asignación alumno-profesor, gestión de clases, planes e incidencias.

## Fase 6 — Pagos

1. Interfaz `PaymentProvider` (checkout, suscripción, cancelación, verificación de webhook).
2. Primer adaptador: **Mercado Pago** (mercado inicial AR) — checkout de suscripción, webhooks idempotentes, página "Mi suscripción" (plan, precio, próxima renovación, historial, **cancelar sin contactar soporte**).
3. Segundo adaptador: Stripe (ES). Selección por `country` del alumno.

## Fase 7 — IA / Fase 8 — Escala

Según roadmap del brief; sin diseño detallado todavía (a propósito).

## Definition of Done (toda fase)

- `tsc --noEmit` y lint sin errores.
- Mutaciones: validación Zod + verificación de rol en servidor.
- Tablas nuevas: RLS escrito y probado en la misma migración.
- Funciona en viewport mobile (375px) antes que en desktop.
- Sin secretos en código ni en cliente.
- Documentación actualizada si cambió arquitectura o esquema.
