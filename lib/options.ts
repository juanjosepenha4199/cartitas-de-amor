export const ENVELOPE_COLORS = [
  { id: "beige", label: "Beige cálido", bg: "bg-[#e8dcc8]", border: "border-[#c4b49a]" },
  { id: "rose", label: "Rosa pastel", bg: "bg-[#f3d4dc]", border: "border-[#e0a8b8]" },
  { id: "sky", label: "Azul pastel", bg: "bg-[#d4e8f2]", border: "border-[#9ec4d8]" },
  { id: "lavender", label: "Lavanda", bg: "bg-[#e4dcf5]", border: "border-[#b8a8d8]" },
  { id: "cream", label: "Crema", bg: "bg-[#faf6ef]", border: "border-[#e2d8c8]" },
] as const;

export const FLOWER_TYPES = [
  { id: "tulip", label: "Tulipán", emoji: "🌷" },
  { id: "rose", label: "Rosas", emoji: "🌹" },
  { id: "sunflower", label: "Girasol", emoji: "🌻" },
  { id: "daisy", label: "Margaritas", emoji: "🌼" },
  { id: "wild", label: "Flores silvestres", emoji: "🌺" },
] as const;

export const FLOWER_DENSITY = [
  { id: "low", label: "Pocas", count: 4 },
  { id: "medium", label: "Media", count: 8 },
  { id: "high", label: "Abundante", count: 14 },
] as const;

export const PAPER_TYPES = [
  { id: "textured", label: "Texturizado", className: "bg-[#fffdf8] shadow-inner" },
  { id: "vintage", label: "Vintage", className: "bg-[#f7f0e4] opacity-95" },
  { id: "clean", label: "Limpio", className: "bg-white" },
] as const;

export const FONT_STYLES = [
  { id: "handwriting", label: "Manuscrita", className: "font-hand" },
  { id: "serif", label: "Serif romántica", className: "font-serif-romantic" },
  { id: "minimal", label: "Minimalista", className: "font-minimal" },
] as const;

export const STICKERS = [
  { id: "none", label: "Sin sticker" },
  { id: "hearts", label: "Corazones" },
  { id: "stars", label: "Estrellas" },
  { id: "moon", label: "Luna" },
] as const;

export type EnvelopeColorId = (typeof ENVELOPE_COLORS)[number]["id"];
export type FlowerTypeId = (typeof FLOWER_TYPES)[number]["id"];
export type FlowerDensityId = (typeof FLOWER_DENSITY)[number]["id"];
export type PaperTypeId = (typeof PAPER_TYPES)[number]["id"];
export type FontStyleId = (typeof FONT_STYLES)[number]["id"];
export type StickerId = (typeof STICKERS)[number]["id"];
