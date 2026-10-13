# Setup del proyecto

## Requisitos

- Node.js 20+
- Una cuenta en [supabase.com](https://supabase.com) (plan gratuito alcanza para desarrollo)

## 1. Instalar dependencias

```bash
npm install
```

## 2. Crear el proyecto en Supabase

1. Crear un proyecto nuevo en el dashboard de Supabase (región recomendada: `sa-east-1` São Paulo para AR, o `eu-west` para ES).
2. En **Project Settings → API**, copiar la URL y las claves.
3. Copiar `.env.example` a `.env.local` y completar:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (⚠️ secreta, nunca en el cliente)

## 3. Aplicar las migraciones

Opción A — SQL Editor del dashboard (rápido para arrancar):

1. Abrir **SQL Editor** en el dashboard.
2. Ejecutar en orden: `supabase/migrations/0001_identity.sql`, luego `0002_domain.sql`, luego `0003_guards.sql`, luego `0004_plan_catalog.sql`, luego `0005_teacher_room.sql`, luego `0006_manual_plans.sql`, luego `supabase/seed.sql`.

Opción B — Supabase CLI (recomendado a mediano plazo):

```bash
npx supabase link --project-ref <ref-del-proyecto>
npx supabase db push
```

## 4. Configurar Auth en el dashboard

- **Authentication → URL Configuration**: agregar `http://localhost:3000/auth/callback` (y la URL de producción cuando exista) a Redirect URLs. Site URL: `http://localhost:3000`.
- **Authentication → Email**: los emails de confirmación y recuperación usan las plantillas por defecto de Supabase por ahora (personalizar en Fase 3 con Resend).

## 5. Emails de registro y contraseña (obligatorio)

El SMTP incluido en Supabase solo envía a miembros del equipo del proyecto: sin SMTP propio, los alumnos no reciben el email de confirmación.

- **Authentication → Emails → SMTP Settings**: hoy se usa Gmail (`academylearningtf@gmail.com`, contraseña de aplicación de Google, `smtp.gmail.com:465`). Al tener dominio, pasar a Resend (ver §9).
- **Authentication → Emails → Templates**: pegar `supabase/templates/confirm-signup.html` en "Confirm sign up" y `supabase/templates/reset-password.html` en "Reset password" (los asuntos están en el comentario de cada archivo).
- **Authentication → URL Configuration**: Site URL = URL de producción; Redirect URLs con `/**` para producción y `http://localhost:3000/**`.

## 5b. Emails de la plataforma y recordatorios (opcional)

Sin configurar, la app funciona igual y solo registra en el log los emails que habría enviado.

1. Crear cuenta en [Resend](https://resend.com), verificar el dominio de envío y generar una API key.
2. Cargar en `.env.local` y en Vercel: `RESEND_API_KEY` y `EMAIL_FROM` (ej. `Learning to Fly Academy <hola@tudominio.com>`).
3. Para los recordatorios diarios (`vercel.json`, todos los días 12:00 UTC): cargar `CRON_SECRET` en Vercel (un valor aleatorio largo). Sin esa variable el endpoint `/api/cron/reminders` rechaza todo.

Emails que se envían: clase reservada (alumno y profesor), clase cancelada (ambos), recordatorio el día anterior (ambos) y profesor asignado (alumno).

## 6. Correr

```bash
npm run dev        # http://localhost:3000
npm run typecheck  # tsc --noEmit
npm run lint
npm run build
```

## 7. Crear el primer admin

Los registros nuevos siempre nacen con rol `student` (regla de seguridad). Para promover un usuario a admin, ejecutar en el SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'tu-email@ejemplo.com';
```

El trigger sincroniza el rol al JWT; el usuario debe cerrar sesión y volver a entrar para que aplique.

## 8. Copias de seguridad (plan Free de Supabase: no hay backups automáticos)

```bash
npm run backup
```

Exporta todas las tablas y las cuentas a `backups/AAAA-MM-DD/*.json` (carpeta ignorada por git: contiene datos personales; guardarla también fuera de la PC, p. ej. en un Drive privado). Correrlo al menos una vez por semana. El esquema no se exporta porque está en `supabase/migrations/`. Las contraseñas no son exportables: tras una restauración los usuarios usan "¿Olvidaste tu contraseña?". Los archivos subidos (avatares) no se incluyen.

## 9. Dominio propio (cuando esté comprado)

1. **Vercel → proyecto → Settings → Domains → Add**: cargar el dominio y crear en el proveedor del dominio los registros DNS que indica Vercel.
2. **Vercel → Environment Variables**: `NEXT_PUBLIC_APP_URL` = `https://tudominio.com` y redeploy.
3. **Supabase → Authentication → URL Configuration**: Site URL = `https://tudominio.com`; agregar `https://tudominio.com/auth/callback` a Redirect URLs (dejar las existentes).
4. **Resend → Domains → Add domain**: crear en el DNS los registros que indica (SPF/DKIM) y esperar "Verified". Crear la API key y cargar `RESEND_API_KEY`, `EMAIL_FROM` (`Learning to Fly Academy <hola@tudominio.com>`) y `CRON_SECRET` en Vercel.
5. **Supabase → Authentication → Emails → SMTP Settings** (emails de registro y contraseña sin el límite del plan Free): host `smtp.resend.com`, puerto `465`, usuario `resend`, contraseña = la API key de Resend, remitente = el mismo de `EMAIL_FROM`.
6. Si ya están configurados los pagos: actualizar la URL de los webhooks de MercadoPago y Stripe al dominio nuevo.

## Notas

- Sin `.env.local`, la app igual levanta y muestra la landing (sin precios); login/registro requieren Supabase configurado.
- La landing lee los planes de la tabla `plans` (catálogo cargado por `0004_plan_catalog.sql`). Los precios en ARS se actualizan a mano desde **Admin → Planes**.
