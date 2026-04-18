-- Ejecutá este script en Neon → SQL Editor (base nueva o vacía).

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  email_verified TIMESTAMPTZ,
  image TEXT,
  password_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS letters (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  envelope_color TEXT NOT NULL,
  flower_type TEXT NOT NULL,
  flower_density TEXT NOT NULL,
  paper_type TEXT NOT NULL,
  font_style TEXT NOT NULL,
  sticker TEXT NOT NULL DEFAULT 'none',
  recipient_name TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_secret BOOLEAN NOT NULL DEFAULT false,
  password_hash TEXT,
  author_name TEXT NOT NULL,
  client_author_id TEXT,
  heart_count INTEGER NOT NULL DEFAULT 0,
  blossom_count INTEGER NOT NULL DEFAULT 0,
  sparkle_count INTEGER NOT NULL DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id TEXT REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS letters_public_created_idx
  ON letters (is_public, created_at DESC);

CREATE INDEX IF NOT EXISTS letters_client_author_idx
  ON letters (client_author_id);

CREATE INDEX IF NOT EXISTS letters_user_created_idx
  ON letters (user_id, created_at DESC);
