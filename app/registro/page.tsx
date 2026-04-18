import { Suspense } from "react";

import { RegistroForm } from "./registro-form";

export default function RegistroPage() {
  return (
    <Suspense
      fallback={
        <p className="text-center text-sm text-stone-500 dark:text-garden-300/80">
          Cargando…
        </p>
      }
    >
      <RegistroForm />
    </Suspense>
  );
}
