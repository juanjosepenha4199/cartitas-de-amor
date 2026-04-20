"use client";

import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useState } from "react";

export function EmailChangeForm() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const currentEmail = session?.user?.email ?? "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setBusy(true);
    try {
      const res = await fetch("/api/account/email", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });
      let data: { error?: string; email?: string } = {};
      try {
        data = (await res.json()) as { error?: string; email?: string };
      } catch {
        /* no JSON */
      }
      if (!res.ok) {
        setError(data.error ?? "No se pudo actualizar el correo.");
        return;
      }

      const newEmail = String(data.email ?? email.trim()).trim().toLowerCase();
      const sign = await signIn("credentials", {
        email: newEmail,
        password,
        redirect: false,
      });
      if (sign?.error) {
        setError(
          "El correo se guardó, pero la sesión no se renovó. Entrá de nuevo con el nuevo email.",
        );
        setPassword("");
        return;
      }

      setEmail("");
      setPassword("");
      setSuccess(true);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") {
    return (
      <p className="text-sm text-stone-500 dark:text-garden-300/85">Cargando…</p>
    );
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="space-y-4 rounded-3xl border border-stone-200/80 bg-[var(--surface)]/90 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
    >
      <p className="text-sm text-stone-600 dark:text-garden-200/90">
        Correo actual:{" "}
        <span className="font-medium text-stone-800 dark:text-garden-50">
          {currentEmail || "—"}
        </span>
      </p>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-stone-700 dark:text-garden-100">
          Nuevo correo electrónico
        </span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-like"
          placeholder="nuevo@ejemplo.com"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-stone-700 dark:text-garden-100">
          Contraseña actual
        </span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-like"
          placeholder="Para confirmar el cambio"
        />
        <span className="block text-xs text-stone-500 dark:text-garden-300/80">
          Por seguridad, necesitamos tu contraseña para cambiar el correo.
        </span>
      </label>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400/90">
          Correo actualizado correctamente.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-2xl bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60 dark:bg-garden-200 dark:text-stone-900 dark:hover:bg-garden-100"
      >
        {busy ? "Guardando…" : "Cambiar correo"}
      </button>
    </form>
  );
}
