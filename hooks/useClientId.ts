"use client";

import { useEffect, useState } from "react";

const KEY = "gardenLetters_clientId";

export function useClientId(): string | null {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    try {
      let v = localStorage.getItem(KEY);
      if (!v) {
        v = crypto.randomUUID();
        localStorage.setItem(KEY, v);
      }
      setId(v);
    } catch {
      setId(null);
    }
  }, []);

  return id;
}
