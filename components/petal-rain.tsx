"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

export function PetalRain({ active = true }: { active?: boolean }) {
  const reduce = useReducedMotion();
  const petals = useMemo(
    () =>
      Array.from({ length: reduce ? 0 : 18 }, (_, i) => ({
        id: i,
        left: `${(i * 37) % 100}%`,
        delay: (i % 7) * 0.4,
        duration: 10 + (i % 5),
        size: 12 + (i % 4) * 4,
        drift: (i % 2 === 0 ? 1 : -1) * (20 + (i % 6) * 6),
      })),
    [reduce],
  );

  if (!active || reduce) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
      {petals.map((p) => (
        <motion.span
          key={p.id}
          className="absolute -top-8 opacity-50"
          style={{
            left: p.left,
            fontSize: p.size,
          }}
          initial={{ y: -20, x: 0, rotate: 0 }}
          animate={{
            y: ["0vh", "110vh"],
            x: [0, p.drift],
            rotate: [0, 360],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
          }}
        >
          🌸
        </motion.span>
      ))}
    </div>
  );
}
