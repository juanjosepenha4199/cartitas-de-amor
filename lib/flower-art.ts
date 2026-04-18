/**
 * Ilustraciones tipo acuarela en `public/flowers/`.
 * Podés sustituir cada PNG por GIF/WebP animado (mismo nombre y ruta).
 */
export const FLOWER_ART = {
  tulip: "/flowers/tulip.png",
  rose: "/flowers/rose.png",
  sunflower: "/flowers/sunflower.png",
  daisy: "/flowers/daisy.png",
  wild: "/flowers/wild.png",
} as const;

export type FlowerArtId = keyof typeof FLOWER_ART;

export function flowerImageSrc(flowerType: string): string {
  const id = flowerType as FlowerArtId;
  return FLOWER_ART[id] ?? FLOWER_ART.rose;
}
