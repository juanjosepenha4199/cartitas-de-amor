"use client";

import { motion, useReducedMotion } from "framer-motion";

const VB_W = 1200;
const VB_H = 200;
const BASE_Y = 198;

type Layer = {
  n: number;
  seed: number;
  gradId: string;
  maxH: number;
  minH: number;
  w: number;
  opacity: number;
};

function pseudo(i: number, seed: number) {
  const x = Math.sin((i + 1) * 12.9898 + seed) * 43758.5453;
  return x - Math.floor(x);
}

function bladeD(i: number, layer: Layer): string {
  const p = pseudo(i, layer.seed);
  const x = (i * (VB_W / layer.n) + p * 28 - 6) % (VB_W + 30);
  const h = layer.minH + p * (layer.maxH - layer.minH);
  const lean = -18 + p * 36;
  const w = layer.w * (0.85 + p * 0.35);
  const cp = h * (0.45 + p * 0.15);
  const tipX = x + lean;
  const tipY = BASE_Y - h;
  return `M ${x - w * 0.55} ${BASE_Y} Q ${x - w * 0.35} ${BASE_Y - cp} ${tipX} ${tipY} Q ${x + w * 0.4} ${BASE_Y - cp * 0.92} ${x + w * 0.52} ${BASE_Y} Z`;
}

function GrassLayer({ layer }: { layer: Layer }) {
  return (
    <g opacity={layer.opacity}>
      {Array.from({ length: layer.n }, (_, i) => (
        <path key={i} d={bladeD(i, layer)} fill={`url(#${layer.gradId})`} />
      ))}
    </g>
  );
}

export function GardenGrassStrip({
  className = "",
  idPrefix = "grass",
}: {
  className?: string;
  /** Prefijo único por instancia SVG (evita ids duplicados si hay varios prados). */
  idPrefix?: string;
}) {
  const reduce = useReducedMotion();
  const back = `${idPrefix}-back`;
  const mid = `${idPrefix}-mid`;
  const front = `${idPrefix}-front`;
  const backGrad = { a: "#0a3d24", b: "#1a6b3e", c: "#2d8f55" };
  const midGrad = { a: "#0f5132", b: "#22804a", c: "#4ade80" };
  const frontGrad = { a: "#14532d", b: "#16a34a", c: "#86efac" };

  const layers: Layer[] = [
    { n: 38, seed: 11, gradId: back, maxH: 118, minH: 62, w: 14, opacity: 0.92 },
    { n: 34, seed: 29, gradId: mid, maxH: 132, minH: 72, w: 16, opacity: 0.96 },
    { n: 30, seed: 47, gradId: front, maxH: 148, minH: 78, w: 18, opacity: 1 },
  ];

  return (
    <div
      className={`pointer-events-none select-none dark:brightness-[0.88] dark:saturate-110 ${className}`}
      aria-hidden
    >
      <svg
        className="h-[min(42vw,200px)] w-full sm:h-[min(38vw,220px)]"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={back} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor={backGrad.a} />
            <stop offset="55%" stopColor={backGrad.b} />
            <stop offset="100%" stopColor={backGrad.c} />
          </linearGradient>
          <linearGradient id={mid} x1="0%" y1="100%" x2="8%" y2="0%">
            <stop offset="0%" stopColor={midGrad.a} />
            <stop offset="50%" stopColor={midGrad.b} />
            <stop offset="100%" stopColor={midGrad.c} />
          </linearGradient>
          <linearGradient id={front} x1="0%" y1="100%" x2="-6%" y2="0%">
            <stop offset="0%" stopColor={frontGrad.a} />
            <stop offset="45%" stopColor={frontGrad.b} />
            <stop offset="100%" stopColor={frontGrad.c} />
          </linearGradient>
        </defs>
        <rect x="0" y={BASE_Y - 4} width={VB_W} height={10} fill={backGrad.a} />
        <GrassLayer layer={layers[0]!} />
        <motion.g
          style={{ transformOrigin: `${VB_W / 2}px ${BASE_Y}px` }}
          animate={reduce ? undefined : { rotate: [0, 0.35, 0, -0.28, 0] }}
          transition={
            reduce
              ? undefined
              : { duration: 6.2, repeat: Infinity, ease: "easeInOut" }
          }
        >
          <GrassLayer layer={layers[1]!} />
        </motion.g>
        <motion.g
          style={{ transformOrigin: `${VB_W / 2}px ${BASE_Y}px` }}
          animate={reduce ? undefined : { rotate: [0, 0.55, 0, -0.42, 0] }}
          transition={
            reduce
              ? undefined
              : { duration: 5.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }
          }
        >
          <GrassLayer layer={layers[2]!} />
        </motion.g>
      </svg>
    </div>
  );
}
