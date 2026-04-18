"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { motion } from "framer-motion";

export function EntrarForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/perfil";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        setError("Email o contraseña incorrectos.");
        return;
      }
      window.location.href = callbackUrl;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="font-serif-romantic text-3xl text-stone-900 dark:text-garden-50">
          Entrar
        </h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-garden-200/90">
          Tu jardín y tu perfil te esperan.
        </p>
      </motion.div>

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="space-y-4 rounded-3xl border border-stone-200/80 bg-[var(--surface)]/90 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
      >
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-stone-700 dark:text-garden-100">
            Email
          </span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-like"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-stone-700 dark:text-garden-100">
            Contraseña
          </span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-like"
          />
        </label>
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-stone-900 py-2.5 text-sm font-medium text-white transition enabled:hover:bg-stone-800 disabled:opacity-60 dark:bg-garden-100 dark:text-garden-900 dark:hover:bg-white"
        >
          {busy ? "Entrando…" : "Entrar"}
        </button>
        <p className="text-center text-sm text-stone-600 dark:text-garden-200/85">
          ¿No tenés cuenta?{" "}
          <Link
            href="/registro"
            className="font-medium text-stone-900 underline underline-offset-4 dark:text-garden-50"
          >
            Registrate
          </Link>
        </p>
      </form>
    </div>
  );
}
