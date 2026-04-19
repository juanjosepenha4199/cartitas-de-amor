/**
 * Límite de caracteres del cuerpo de la carta (validación API + editor).
 * La columna en BD es TEXT (sin tope práctico en Postgres).
 * ~32k caracteres cubren cómodamente textos largos (p. ej. 500+ palabras).
 */
export const MAX_LETTER_CONTENT_CHARS = 32_000;
