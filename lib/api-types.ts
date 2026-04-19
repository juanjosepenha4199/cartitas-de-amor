export type LetterDto = {
  id: string;
  content: string | null;
  locked: boolean;
  envelopeColor: string;
  flowerType: string;
  flowerDensity: string;
  paperType: string;
  fontStyle: string;
  sticker: string;
  recipientName: string | null;
  isPublic: boolean;
  isSecret: boolean;
  authorName: string;
  clientAuthorId: string | null;
  heartCount: number;
  blossomCount: number;
  sparkleCount: number;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string | null;
  recipientUserId: string | null;
  /** Data URLs JPEG guardadas con la carta (vacío si es secreta y está bloqueada). */
  imageAttachments: string[];
  score?: number;
};
