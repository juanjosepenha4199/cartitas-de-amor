"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { motion } from "framer-motion";

export function RegistroForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const entrarQuery = new URLSearchParams({ callbackUrl }).toString();
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          name: name.trim() || undefined,
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      let data: { error?: string } = {};
      try {
        data = (await res.json()) as { error?: string };
      } catch {
        /* respuesta no JSON */
      }
      if (!res.ok) {
        setError(data.error ?? "No se pudo registrar.");
        return;
      }
      const sign = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl,
      });
      if (sign?.error) {
        router.push(`/entrar?${entrarQuery}`);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
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
          Crear cuenta
        </h1>
        <p className="mt-2 text-sm text-stone-600 dark:text-garden-200/90">
          Un solo jardín por cuenta: tus cartas quedan asociadas a vos.
        </p>
      </motion.div>

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="space-y-4 rounded-3xl border border-stone-200/80 bg-[var(--surface)]/90 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
      >
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-stone-700 dark:text-garden-100">
            Nombre de usuario <span className="text-red-600">*</span>
          </span>
          <input
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) =>
              setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
            }
            className="input-like"
            placeholder="solo minúsculas, números y _"
            minLength={3}
            maxLength={20}
          />
          <span className="block text-xs text-stone-500 dark:text-garden-300/80">
            Es único: así te pueden enviar cartas. Entre 3 y 20 caracteres.
          </span>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-stone-700 dark:text-garden-100">
            Nombre para mostrar (opcional)
          </span>
          <input
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-like"
            placeholder="Cómo te gusta firmar"
          />
        </label>
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
            Contraseña (mín. 8)
          </span>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
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
          {busy ? "Creando…" : "Registrarme"}
        </button>
        <p className="text-center text-sm text-stone-600 dark:text-garden-200/85">
          ¿Ya tenés cuenta?{" "}
          <Link
            href={`/entrar?${entrarQuery}`}
            className="font-medium text-stone-900 underline underline-offset-4 dark:text-garden-50"
          >
            Entrar
          </Link>
        </p>
      </form>
    </div>
  );
}
