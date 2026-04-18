/** Modelo de carta usado por la API y la capa SQL. */
export type Letter = {
  id: string;
  content: string;
  envelopeColor: string;
  flowerType: string;
  flowerDensity: string;
  paperType: string;
  fontStyle: string;
  sticker: string;
  recipientName: string | null;
  isPublic: boolean;
  isSecret: boolean;
  passwordHash: string | null;
  authorName: string;
  clientAuthorId: string | null;
  heartCount: number;
  blossomCount: number;
  sparkleCount: number;
  scheduledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string | null;
};

type LetterRow = {
  id: string;
  content: string;
  envelope_color: string;
  flower_type: string;
  flower_density: string;
  paper_type: string;
  font_style: string;
  sticker: string;
  recipient_name: string | null;
  is_public: boolean;
  is_secret: boolean;
  password_hash: string | null;
  author_name: string;
  client_author_id: string | null;
  heart_count: number;
  blossom_count: number;
  sparkle_count: number;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
};

export function mapLetterRow(r: LetterRow): Letter {
  return {
    id: r.id,
    content: r.content,
    envelopeColor: r.envelope_color,
    flowerType: r.flower_type,
    flowerDensity: r.flower_density,
    paperType: r.paper_type,
    fontStyle: r.font_style,
    sticker: r.sticker,
    recipientName: r.recipient_name,
    isPublic: r.is_public,
    isSecret: r.is_secret,
    passwordHash: r.password_hash,
    authorName: r.author_name,
    clientAuthorId: r.client_author_id,
    heartCount: r.heart_count,
    blossomCount: r.blossom_count,
    sparkleCount: r.sparkle_count,
    scheduledAt: r.scheduled_at ? new Date(r.scheduled_at) : null,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
    userId: r.user_id,
  };
}
