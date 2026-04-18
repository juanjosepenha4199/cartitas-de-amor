import { Suspense } from "react";
import { EntrarForm } from "./entrar-form";

export default function EntrarPage() {
  return (
    <Suspense
      fallback={
        <p className="text-center text-sm text-stone-500 dark:text-garden-300/80">
          Cargando…
        </p>
      }
    >
      <EntrarForm />
    </Suspense>
  );
}
