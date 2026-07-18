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
2. Ejecutar en orden: `supabase/migrations/0001_identity.sql`, luego `0002_domain.sql`, luego `supabase/seed.sql`.

Opción B — Supabase CLI (recomendado a mediano plazo):

```bash
npx supabase link --project-ref <ref-del-proyecto>
npx supabase db push
```

## 4. Configurar Auth en el dashboard

- **Authentication → URL Configuration**: agregar `http://localhost:3000/auth/callback` (y la URL de producción cuando exista) a Redirect URLs. Site URL: `http://localhost:3000`.
- **Authentication → Email**: los emails de confirmación y recuperación usan las plantillas por defecto de Supabase por ahora (personalizar en Fase 3 con Resend).

## 5. Correr

```bash
npm run dev        # http://localhost:3000
npm run typecheck  # tsc --noEmit
npm run lint
npm run build
```

## 6. Crear el primer admin

Los registros nuevos siempre nacen con rol `student` (regla de seguridad). Para promover un usuario a admin, ejecutar en el SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'tu-email@ejemplo.com';
```

El trigger sincroniza el rol al JWT; el usuario debe cerrar sesión y volver a entrar para que aplique.

## Notas

- Sin `.env.local`, la app igual levanta y muestra la landing (con planes de fallback); login/registro requieren Supabase configurado.
- La landing lee los planes de la tabla `plans`; si la DB no responde usa los valores espejo de `src/lib/services/plans.ts` (mantener sincronizados con `supabase/seed.sql`).
