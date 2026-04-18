import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

import { PortadaContent } from "./portada-content";

export default async function PortadaPage() {
  const session = await auth();
  if (session) {
    redirect("/");
  }
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
