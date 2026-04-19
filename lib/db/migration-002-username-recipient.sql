-- Migración para bases ya creadas (ejecutar en Neon → SQL Editor).
-- Genera un username único por fila existente; podés editarlo después en la tabla users.

ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;

UPDATE users
SET username = 'u_' || substring(md5(id::text || email) from 1 for 16)
WHERE username IS NULL;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_unique;
ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (username);

ALTER TABLE users ALTER COLUMN username SET NOT NULL;

ALTER TABLE letters ADD COLUMN IF NOT EXISTS recipient_user_id TEXT REFERENCES users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS letters_recipient_user_idx
  ON letters (recipient_user_id, created_at DESC);
