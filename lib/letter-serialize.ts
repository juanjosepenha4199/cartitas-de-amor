import type { Letter } from "@/lib/letter-types";

export type LetterPublic = Omit<Letter, "passwordHash" | "content"> & {
  content: string | null;
  imageAttachments: string[];
  locked: boolean;
  score?: number;
};

export function serializeLetter(
  letter: Letter,
  opts: { revealContent: boolean },
): LetterPublic {
  const locked = letter.isSecret && !opts.revealContent;
  const { passwordHash, ...rest } = letter;
  void passwordHash;
  return {
    ...rest,
    content: locked ? null : letter.content,
    imageAttachments: locked ? [] : letter.imageAttachments,
    locked,
    score: letter.heartCount * 3 + letter.blossomCount * 2 + letter.sparkleCount,
  };
}
