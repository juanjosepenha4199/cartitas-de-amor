"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "gardenLetters_favorites";

export function useFavorites() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setIds(JSON.parse(raw) as string[]);
    } catch {
      setIds([]);
    }
  }, []);

  const persist = useCallback((next: string[]) => {
    setIds(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(
    (letterId: string) => {
      persist(
        ids.includes(letterId)
          ? ids.filter((x) => x !== letterId)
          : [...ids, letterId],
      );
    },
    [ids, persist],
  );

  const isFavorite = useCallback(
    (letterId: string) => ids.includes(letterId),
    [ids],
  );

  return { favoriteIds: ids, toggle, isFavorite };
}
