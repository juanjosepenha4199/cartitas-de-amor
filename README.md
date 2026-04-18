# GARDEN LETTERS

Plataforma romántica para crear, personalizar y guardar **cartas digitales** con estética de sobres y flores. Incluye **cuentas con Auth.js**, jardín personal, jardín público, cartas secretas, programación de publicación y despliegue sencillo en **Vercel** con **Neon** (PostgreSQL) y **Prisma**.

## Stack

- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS, Framer Motion
- **Auth:** Auth.js v5 (`next-auth@beta`), sesión JWT, registro con email + contraseña
- **Datos:** PostgreSQL ([Neon](https://neon.tech)) + Prisma ORM

## Requisitos

- Node.js 20+
- Proyecto en [Neon](https://console.neon.tech) (gratis) con cadena de conexión PostgreSQL

## Variables de entorno

Copiá `.env.example` a `.env` y completá:

| Variable        | Descripción |
| --------------- | ----------- |
| `DATABASE_URL`  | Connection string de Neon (pestaña “Connection details”). |
| `AUTH_SECRET`   | Secreto largo y aleatorio (`openssl rand -base64 32`). |
| `AUTH_URL`      | Opcional en local. En Vercel suele inferirse; podés fijar la URL del deploy. |

## Puesta en marcha (local)

1. `npm install`
2. Configurá `.env` con Neon + `AUTH_SECRET`.
3. Aplicá el esquema a la base:

   ```bash
   npx prisma db push
   ```

   O, si usás migraciones: `npm run db:migrate`.

4. `npm run dev` → [http://localhost:3000](http://localhost:3000)

Rutas útiles: `/entrar`, `/registro`, `/perfil` (requiere sesión), `/jardin`, `/crear`.

## Despliegue en Vercel

1. Subí el repo a GitHub/GitLab y conectalo en [Vercel](https://vercel.com).
2. En el proyecto Vercel → **Settings → Environment Variables**, agregá:
   - `DATABASE_URL` (Neon)
   - `AUTH_SECRET` (el mismo tipo de secreto que en local)
   - Opcional: `AUTH_URL` = `https://tu-dominio.vercel.app`
3. **Build command** por defecto: `prisma generate && next build` (ya está en `package.json`).
4. Tras el primer deploy, ejecutá `npx prisma db push` o migraciones **contra la misma URL de Neon** desde tu máquina (o usá Neon SQL editor / CI).

Neon y Vercel están en la misma región cuando podés, para menor latencia.

## Comportamiento de cuentas

- Al **registrarte / entrar**, las cartas nuevas se guardan con `userId` (tu jardín en **Perfil** y filtro **Solo mías** en el jardín público).
- Quien no entra puede seguir creando cartas anónimas con el identificador del navegador (modo compatibilidad).
- **Perfil** está protegido por `app/perfil/layout.tsx`: redirige a `/entrar` si no hay sesión (evita middleware en Edge con JWT).

## Scripts útiles

| Comando             | Descripción                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Desarrollo (Turbopack)               |
| `npm run build`     | Producción                           |
| `npm run start`     | Servidor tras `build`                |
| `npm run db:studio` | Prisma Studio                        |
| `npm run db:push`   | Sincroniza schema con la DB          |
| `npm run db:migrate`| Migraciones en desarrollo            |

## Estructura destacada

- `auth.ts` — configuración Auth.js + Prisma adapter
- `app/api/auth/[...nextauth]/route.ts` — rutas de sesión
- `app/api/register/route.ts` — alta de usuario
- `app/perfil/layout.tsx` — protege `/perfil` con `auth()` en servidor
- `prisma/schema.prisma` — `User`, `Account`, `Session`, `Letter`, etc.

## Licencia

Uso personal del proyecto. Ajustá la licencia según tu necesidad.
