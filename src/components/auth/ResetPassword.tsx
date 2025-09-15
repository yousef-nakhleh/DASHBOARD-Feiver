// src/components/auth/ResetPassword.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Check if this page was reached from a valid email link (i.e., there is a session)
  useEffect(() => {
    let active = true;
    (async () => {
      setChecking(true);
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error) {
        console.error("getSession error:", error);
      }
      setHasSession(!!data?.session);
      setChecking(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!password) return setError("La password è obbligatoria.");
    if (password.length < 8) return setError("La password deve avere almeno 8 caratteri.");
    if (password !== confirm) return setError("Le password non coincidono.");

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      // Option A: force user to log in again with new password
      setInfo("Password aggiornata con successo. Reindirizzamento alla pagina di accesso…");
      // small pause so the user can read the message
      setTimeout(async () => {
        // ensure we clear any temp session from the reset link
        await supabase.auth.signOut().catch(() => {});
        navigate("/login", { replace: true });
      }, 800);
    } catch (err: any) {
      setError(err?.message ?? "Impossibile aggiornare la password.");
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50">
        <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow text-center">
          <div className="animate-pulse text-gray-700 mb-2">Verifica link…</div>
          <div className="text-sm text-gray-500">Attendere un istante.</div>
        </div>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow p-6 text-center">
          <h1 className="text-xl font-bold text-black mb-2">Link non valido o scaduto</h1>
          <p className="text-sm text-gray-600 mb-6">
            Apri questa pagina dal link ricevuto via email per reimpostare la password.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="rounded-xl bg-black px-4 py-2 font-medium text-white"
          >
            Torna al login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold text-black mb-2">Imposta una nuova password</h1>
        <p className="text-sm text-gray-500 mb-6">
          Inserisci la nuova password e confermala per completare il reset.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {info && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {info}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Nuova password</label>
            <input
              type="password"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Conferma nuova password</label>
            <input
              type="password"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="ripeti la password"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-xl bg-black px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            {submitting ? "Aggiornamento…" : "Aggiorna password"}
          </button>
        </form>
      </div>
    </div>
  );
}