import { randomUUID } from "node:crypto";

import { sql } from "@/lib/db/sql";
import { mapLetterRow, type Letter } from "@/lib/letter-types";

type LetterRow = Parameters<typeof mapLetterRow>[0];

async function mapRows(rows: unknown[]): Promise<Letter[]> {
  return rows.map((r) => mapLetterRow(r as LetterRow));
}

export async function findLetterById(id: string): Promise<Letter | null> {
  const rows = await sql`
    SELECT
      id, content, envelope_color, flower_type, flower_density, paper_type,
      font_style, sticker, recipient_name, is_public, is_secret, password_hash,
      author_name, client_author_id, heart_count, blossom_count, sparkle_count,
      scheduled_at, created_at, updated_at, user_id
    FROM letters
    WHERE id = ${id}
    LIMIT 1
  `;
  const r = rows[0] as LetterRow | undefined;
  return r ? mapLetterRow(r) : null;
}

export async function listLettersForUser(options: {
  userId: string;
  search: string;
}): Promise<Letter[]> {
  const { userId, search } = options;
  if (search) {
    const pattern = `%${search}%`;
    const rows = await sql`
      SELECT
        id, content, envelope_color, flower_type, flower_density, paper_type,
        font_style, sticker, recipient_name, is_public, is_secret, password_hash,
        author_name, client_author_id, heart_count, blossom_count, sparkle_count,
        scheduled_at, created_at, updated_at, user_id
      FROM letters
      WHERE user_id = ${userId}
        AND (scheduled_at IS NULL OR scheduled_at <= NOW())
        AND (
          content ILIKE ${pattern}
          OR author_name ILIKE ${pattern}
          OR recipient_name ILIKE ${pattern}
        )
      ORDER BY created_at DESC
      LIMIT 120
    `;
    return mapRows(rows);
  }
  const rows = await sql`
    SELECT
      id, content, envelope_color, flower_type, flower_density, paper_type,
      font_style, sticker, recipient_name, is_public, is_secret, password_hash,
      author_name, client_author_id, heart_count, blossom_count, sparkle_count,
      scheduled_at, created_at, updated_at, user_id
    FROM letters
    WHERE user_id = ${userId}
      AND (scheduled_at IS NULL OR scheduled_at <= NOW())
    ORDER BY created_at DESC
    LIMIT 120
  `;
  return mapRows(rows);
}

export async function listLettersForClient(options: {
  clientAuthorId: string;
  search: string;
}): Promise<Letter[]> {
  const { clientAuthorId, search } = options;
  if (search) {
    const pattern = `%${search}%`;
    const rows = await sql`
      SELECT
        id, content, envelope_color, flower_type, flower_density, paper_type,
        font_style, sticker, recipient_name, is_public, is_secret, password_hash,
        author_name, client_author_id, heart_count, blossom_count, sparkle_count,
        scheduled_at, created_at, updated_at, user_id
      FROM letters
      WHERE client_author_id = ${clientAuthorId}
        AND (scheduled_at IS NULL OR scheduled_at <= NOW())
        AND (
          content ILIKE ${pattern}
          OR author_name ILIKE ${pattern}
          OR recipient_name ILIKE ${pattern}
        )
      ORDER BY created_at DESC
      LIMIT 120
    `;
    return mapRows(rows);
  }
  const rows = await sql`
    SELECT
      id, content, envelope_color, flower_type, flower_density, paper_type,
      font_style, sticker, recipient_name, is_public, is_secret, password_hash,
      author_name, client_author_id, heart_count, blossom_count, sparkle_count,
      scheduled_at, created_at, updated_at, user_id
    FROM letters
    WHERE client_author_id = ${clientAuthorId}
      AND (scheduled_at IS NULL OR scheduled_at <= NOW())
    ORDER BY created_at DESC
    LIMIT 120
  `;
  return mapRows(rows);
}

export async function listPublicLetters(
  search: string,
  opts: { limit?: number } = {},
): Promise<Letter[]> {
  const limit = Math.min(Math.max(opts.limit ?? 120, 1), 500);
  if (search) {
    const pattern = `%${search}%`;
    const rows = await sql`
      SELECT
        id, content, envelope_color, flower_type, flower_density, paper_type,
        font_style, sticker, recipient_name, is_public, is_secret, password_hash,
        author_name, client_author_id, heart_count, blossom_count, sparkle_count,
        scheduled_at, created_at, updated_at, user_id
      FROM letters
      WHERE is_public = true
        AND (scheduled_at IS NULL OR scheduled_at <= NOW())
        AND (
          content ILIKE ${pattern}
          OR author_name ILIKE ${pattern}
          OR recipient_name ILIKE ${pattern}
        )
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return mapRows(rows);
  }
  const rows = await sql`
    SELECT
      id, content, envelope_color, flower_type, flower_density, paper_type,
      font_style, sticker, recipient_name, is_public, is_secret, password_hash,
      author_name, client_author_id, heart_count, blossom_count, sparkle_count,
      scheduled_at, created_at, updated_at, user_id
    FROM letters
    WHERE is_public = true
      AND (scheduled_at IS NULL OR scheduled_at <= NOW())
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return mapRows(rows);
}

export async function insertLetter(data: {
  content: string;
  envelopeColor: string;
  flowerType: string;
  flowerDensity: string;
  paperType: string;
  fontStyle: string;
  sticker: string;
  recipientName: string | null;
  authorName: string;
  isPublic: boolean;
  isSecret: boolean;
  passwordHash: string | null;
  clientAuthorId: string | null;
  userId: string | null;
  scheduledAt: Date | null;
}): Promise<Letter> {
  const id = randomUUID();
  const rows = await sql`
    INSERT INTO letters (
      id, content, envelope_color, flower_type, flower_density, paper_type,
      font_style, sticker, recipient_name, author_name, is_public, is_secret,
      password_hash, client_author_id, user_id, scheduled_at
    ) VALUES (
      ${id},
      ${data.content},
      ${data.envelopeColor},
      ${data.flowerType},
      ${data.flowerDensity},
      ${data.paperType},
      ${data.fontStyle},
      ${data.sticker},
      ${data.recipientName},
      ${data.authorName},
      ${data.isPublic},
      ${data.isSecret},
      ${data.passwordHash},
      ${data.clientAuthorId},
      ${data.userId},
      ${data.scheduledAt}
    )
    RETURNING
      id, content, envelope_color, flower_type, flower_density, paper_type,
      font_style, sticker, recipient_name, is_public, is_secret, password_hash,
      author_name, client_author_id, heart_count, blossom_count, sparkle_count,
      scheduled_at, created_at, updated_at, user_id
  `;
  return mapLetterRow(rows[0] as LetterRow);
}

export async function incrementLetterReaction(
  id: string,
  field: "heart_count" | "blossom_count" | "sparkle_count",
): Promise<Letter | null> {
  if (field === "heart_count") {
    const rows = await sql`
      UPDATE letters
      SET heart_count = heart_count + 1, updated_at = NOW()
      WHERE id = ${id}
      RETURNING
        id, content, envelope_color, flower_type, flower_density, paper_type,
        font_style, sticker, recipient_name, is_public, is_secret, password_hash,
        author_name, client_author_id, heart_count, blossom_count, sparkle_count,
        scheduled_at, created_at, updated_at, user_id
    `;
    const r = rows[0] as LetterRow | undefined;
    return r ? mapLetterRow(r) : null;
  }
  if (field === "blossom_count") {
    const rows = await sql`
      UPDATE letters
      SET blossom_count = blossom_count + 1, updated_at = NOW()
      WHERE id = ${id}
      RETURNING
        id, content, envelope_color, flower_type, flower_density, paper_type,
        font_style, sticker, recipient_name, is_public, is_secret, password_hash,
        author_name, client_author_id, heart_count, blossom_count, sparkle_count,
        scheduled_at, created_at, updated_at, user_id
    `;
    const r = rows[0] as LetterRow | undefined;
    return r ? mapLetterRow(r) : null;
  }
  const rows = await sql`
    UPDATE letters
    SET sparkle_count = sparkle_count + 1, updated_at = NOW()
    WHERE id = ${id}
    RETURNING
      id, content, envelope_color, flower_type, flower_density, paper_type,
      font_style, sticker, recipient_name, is_public, is_secret, password_hash,
      author_name, client_author_id, heart_count, blossom_count, sparkle_count,
      scheduled_at, created_at, updated_at, user_id
  `;
  const r = rows[0] as LetterRow | undefined;
  return r ? mapLetterRow(r) : null;
}
