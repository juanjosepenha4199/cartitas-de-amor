# GARDEN LETTERS

App web para escribir y compartir **cartas digitales** (sobres, flores, jardín público). Cuentas con email y contraseña; datos en **PostgreSQL** ([Neon](https://neon.tech)) y Auth.js.

## Cómo correrlo

Necesitás **Node.js 20+**, un proyecto en Neon y las variables en `.env` (partí de `.env.example`):

- `DATABASE_URL` — connection string de Neon  
- `AUTH_SECRET` — secreto largo (`openssl rand -base64 32`)  
- `AUTH_URL` — opcional en local; en producción conviene la URL pública del sitio  

Pasos:

1. `npm install`
2. En Neon → **SQL Editor**, ejecutá **`lib/db/schema.sql`**
3. `npm run dev` y abrí [http://localhost:3000](http://localhost:3000)

En **Vercel**, definí las mismas variables (`DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`) y redeploy después de cambiarlas.

Para producción: `npm run build` y `npm run start`.
