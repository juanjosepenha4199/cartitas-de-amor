import { Suspense } from "react";

import { PortadaContent } from "./portada-content";

/** Quien ya tiene sesión la redirige el middleware a `/`. */
export default function PortadaPage() {
  return (
    <Suspense
      fallback={
        <p className="py-16 text-center text-sm text-stone-500 dark:text-garden-300/80">
          Cargando…
        </p>
      }
    >
      <PortadaContent />
    </Suspense>
  );
}
