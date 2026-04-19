-- Adjuntos de imagen en la carta (JSON array de data URLs o URLs, guardado como texto).
ALTER TABLE letters
ADD COLUMN IF NOT EXISTS image_attachments TEXT NOT NULL DEFAULT '[]';
