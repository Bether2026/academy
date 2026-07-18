# Arquitectura — Plataforma de Inglés Online

> FASE 0 — Documento de decisiones técnicas. Ninguna funcionalidad implementada todavía.
> Última actualización: 2026-07-17

## 1. Resumen de la solución

Monolito modular sobre **Next.js (App Router) + TypeScript**, desplegado en **Vercel**, con **Supabase** (PostgreSQL + Auth + RLS + Storage) como backend de datos. Un solo repositorio, una sola aplicación, separación estricta por capas internas. Sin microservicios: a esta escala serían sobrearquitectura.

```
Navegador (mobile-first)
   │
   ▼
Next.js en Vercel
├── Server Components  → lectura de datos (vía cliente Supabase server-side)
├── Server Actions     → mutaciones con validación Zod + verificación de rol
├── Route Handlers     → webhooks (pagos), endpoints para servicios externos
   │
   ▼
Supabase
├── PostgreSQL + RLS   → única fuente de verdad
├── Auth               → sesiones, JWT con rol en app_metadata
└── Storage            → materiales, avatares

Servicios externos (desacoplados detrás de interfaces en lib/services/)
├── Pagos: Mercado Pago (AR) / Stripe (ES) — intercambiables
├── Email: Resend
├── Video: Google Meet / Zoom (solo se guarda el enlace)
└── IA: futura, detrás de su propio servicio
```

## 2. Decisiones técnicas y su justificación

| # | Decisión | Alternativa descartada | Por qué |
|---|----------|------------------------|---------|
| 1 | Monolito modular Next.js | Microservicios / backend separado (NestJS) | Un equipo chico, un producto. La separación por capas internas da la misma mantenibilidad sin costo operativo. |
| 2 | `profiles.id` = `auth.users.id` (misma PK) | Tabla con `auth_user_id` como columna aparte | Es la convención Supabase: simplifica todas las políticas RLS (`auth.uid() = id`) y elimina un join en cada verificación. |
| 3 | Rol en `profiles.role` **y** en `app_metadata` del JWT | Rol solo en tabla | El rol en el JWT permite verificar permisos en middleware y RLS sin consultar la tabla (evita RLS recursivo, riesgo clásico de Supabase). La tabla es la fuente de verdad; un trigger sincroniza al JWT. |
| 4 | Server Actions para mutaciones, Route Handlers solo para webhooks | API Routes para todo | Menos superficie, tipado end-to-end, validación centralizada. Los webhooks necesitan Route Handlers porque los llama un tercero. |
| 5 | Zod para validación en frontend y backend (esquemas compartidos) | Validación duplicada a mano | Un solo esquema por entidad en `lib/validators/`, importado por el form y por la Server Action. |
| 6 | shadcn/ui + Tailwind | Librería de componentes cerrada (MUI, Chakra) | shadcn copia el código al repo: control total del diseño, sin lock-in, accesibilidad de Radix incluida. |
| 7 | Abstracción de pagos: interfaz `PaymentProvider` con adaptadores `MercadoPagoProvider` y `StripeProvider` | Integrar Mercado Pago directo en la lógica | Requisito explícito. Además AR y ES necesitan proveedores distintos desde el día uno (MP no opera bien en Europa; Stripe no opera en Argentina con ARS). |
| 8 | Todas las fechas en UTC (`timestamptz`); la zona horaria vive en el perfil y se aplica solo al renderizar | Guardar hora local | AR y ES tienen 4–5 h de diferencia y España cambia de horario dos veces al año. Guardar hora local es la fuente de bugs nº 1 en agendas. |
| 9 | Niveles CEFR como `enum` de Postgres | Tabla `levels` | CEFR es un estándar fijo de 6 valores; una tabla agrega joins sin aportar nada. Si algún día hace falta metadata por nivel, se migra. |
| 10 | Constraint de exclusión (`btree_gist`) para impedir doble reserva de un profesor | Validar solo en aplicación | La validación en aplicación tiene condiciones de carrera. La restricción en DB es la garantía final. |
| 11 | Tabla `webhook_events` con idempotencia por `(provider, event_id)` | Procesar webhooks directo | Los proveedores de pago reenvían eventos. Sin idempotencia se duplican pagos/estados. |
| 12 | Migraciones SQL versionadas en `supabase/migrations/` | Cambios manuales en el dashboard | Reproducibilidad, revisión en PR, y camino de salida si algún día se deja Supabase. |
| 13 | i18n preparado desde el inicio (textos en `messages/es.json`), un solo idioma al lanzar | Hardcodear textos | Reescribir strings después es carísimo. Preparar la estructura cuesta poco ahora. |

## 3. Estructura de carpetas propuesta

```
.
├── CLAUDE.md                     # Reglas del proyecto para Claude Code
├── docs/                         # Esta documentación
├── supabase/
│   ├── migrations/               # SQL versionado (esquema, RLS, triggers)
│   └── seed.sql                  # Datos de desarrollo (planes, niveles demo)
├── messages/
│   └── es.json                   # Textos UI (base para multiidioma futuro)
├── public/
└── src/
    ├── app/
    │   ├── (marketing)/          # Landing pública: home, planes, faq, legales
    │   ├── (auth)/               # login, registro, recuperar contraseña
    │   ├── (student)/app/        # Dashboard alumno, clases, progreso, suscripción
    │   ├── (teacher)/teacher/    # Panel profesor: agenda, alumnos, notas
    │   ├── (admin)/admin/        # Panel administrativo
    │   └── api/
    │       └── webhooks/         # mercadopago/, stripe/ (Route Handlers)
    ├── components/
    │   ├── ui/                   # Primitivas shadcn/ui (Button, Card, Dialog…)
    │   └── features/             # Componentes por dominio (classes/, progress/…)
    ├── lib/
    │   ├── supabase/             # Clientes: browser, server, admin (service role)
    │   ├── services/             # Lógica de negocio y servicios externos
    │   │   ├── payments/         # PaymentProvider + adaptadores MP/Stripe
    │   │   ├── email/            # Interfaz + adaptador Resend
    │   │   ├── scheduling/       # Reservas, disponibilidad, zonas horarias
    │   │   └── ai/               # Futuro (Fase 7)
    │   ├── validators/           # Esquemas Zod compartidos front/back
    │   ├── auth/                 # Helpers de sesión y verificación de rol
    │   └── utils/
    ├── types/                    # Tipos de dominio + tipos generados de Supabase
    └── middleware.ts             # Refresh de sesión + protección de rutas por rol
```

Reglas de dependencia entre capas (de arriba hacia abajo, nunca al revés):

```
app/ (UI, páginas) → components/ → lib/services/ (negocio) → lib/supabase/ (datos)
```

- Los componentes **no** llaman a Supabase directamente: pasan por servicios.
- Los servicios **no** conocen React: son funciones puras + acceso a datos.
- Los adaptadores externos (MP, Stripe, Resend) solo se tocan desde `lib/services/`.

## 4. Roles y protección de rutas

Roles: `student` | `teacher` | `admin` (+ `super_admin` reservado, sin implementar).

Defensa en tres capas — **ninguna reemplaza a la siguiente**:

1. **Middleware** (`middleware.ts`): redirige según rol del JWT. Solo UX, no seguridad.
2. **Server Actions / Server Components**: cada acción verifica sesión y rol en servidor antes de operar (`requireRole('teacher')`).
3. **RLS en Postgres**: garantía final. Aunque las capas 1 y 2 fallen, la base de datos no entrega filas ajenas. Detalle en `01-modelo-de-datos.md`.

## 5. Variables de entorno

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=            # pública
NEXT_PUBLIC_SUPABASE_ANON_KEY=       # pública (protegida por RLS)
SUPABASE_SERVICE_ROLE_KEY=           # SECRETA — solo servidor, nunca en cliente
SUPABASE_DB_URL=                     # SECRETA — migraciones

# App
NEXT_PUBLIC_APP_URL=                 # p.ej. https://plataforma.com

# Pagos (Fase 6 — definidas desde ahora para no rediseñar)
MERCADOPAGO_ACCESS_TOKEN=            # SECRETA
MERCADOPAGO_WEBHOOK_SECRET=          # SECRETA
STRIPE_SECRET_KEY=                   # SECRETA
STRIPE_WEBHOOK_SECRET=               # SECRETA
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=  # pública

# Email
RESEND_API_KEY=                      # SECRETA
EMAIL_FROM=                          # p.ej. "Plataforma <hola@dominio.com>"
```

Regla: todo secreto vive en variables de entorno de Vercel / `.env.local` (git-ignored). `NEXT_PUBLIC_` únicamente para valores que pueden ser públicos. Se versiona un `.env.example` sin valores.

## 6. Riesgos detectados

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| **Zonas horarias** (AR sin DST, ES con DST) | Clases reservadas a la hora equivocada — mata la confianza | Todo en UTC en DB; conversión solo en render con la TZ del perfil; tests específicos sobre fechas de cambio horario europeo. |
| **Doble reserva** de un profesor | Dos alumnos en el mismo horario | Constraint de exclusión en Postgres (decisión #10) + validación previa en el servicio de scheduling. |
| **RLS recursivo** (política que consulta la tabla que protege) | Errores 500 difíciles de depurar o, peor, políticas desactivadas "para que funcione" | Rol en JWT + funciones `SECURITY DEFINER` para chequeos cruzados. Nunca desactivar RLS como workaround. |
| **Webhooks de pago duplicados o fuera de orden** | Suscripciones con estado incorrecto, dobles acreditaciones | Tabla `webhook_events` idempotente; los handlers son la única fuente de cambios de estado de pago (nunca el redirect del checkout). |
| **Moneda/proveedor por país** (ARS+MP vs EUR+Stripe) | Complejidad en planes y reportes | Planes con `currency` explícita; un plan por moneda; el adaptador se elige por país del alumno. |
| **Reglas de negocio sin definir**: cancelaciones, ausencias, reprogramación, cambio de profesor | Bloquea Fase 3 (clases) | Decidir antes de Fase 3: ¿cuántas horas antes se puede cancelar sin perder la clase? ¿qué pasa con `no_show`? Los estados ya están modelados; falta la política. |
| **Lock-in Supabase** | Migración costosa si el producto escala mucho | Aceptado conscientemente para v1 (velocidad > portabilidad). Mitigado: SQL estándar versionado, lógica de negocio en `lib/services/` y no en Edge Functions, RLS reproducible. |
| **Pago a profesores** fuera de alcance v1 | Expectativa incorrecta | Explícitamente fuera de alcance hasta Fase 8; `teachers.hourly_rate` queda como dato informativo. |

## 7. Qué NO se construye en v1 (alcance negativo)

- Videollamadas propias (solo enlace externo).
- IA (Fase 7).
- Multiidioma activo (solo preparación).
- Liquidación de pagos a profesores.
- Apps móviles nativas (mobile-first web).
- Gamificación.
- `super_admin` (el enum lo contempla; sin UI ni permisos propios).
