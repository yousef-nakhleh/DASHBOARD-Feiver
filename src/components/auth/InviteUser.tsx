// src/components/auth/InviteUser.tsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate, useLocation } from "react-router-dom";

type Phase = "verifying" | "set-password" | "saving" | "done" | "error";

function parseHashParams(hash: string): Record<string, string> {
  // hash like: #access_token=...&refresh_token=...&type=invite
  const out: Record<string, string> = {};
  const s = hash.startsWith("#") ? hash.slice(1) : hash;
  for (const pair of s.split("&")) {
    if (!pair) continue;
    const [k, v] = pair.split("=");
    if (k) out[decodeURIComponent(k)] = decodeURIComponent(v ?? "");
  }
  return out;
}

export default function InviteUser() {
  const navigate = useNavigate();
  const location = useLocation();

  const [phase, setPhase] = useState<Phase>("verifying");
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // 1) Establish a session from the URL (invite/reset/magic link)
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        // A) Newer flow: `?code=...` (PKCE / email links with code param)
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          // Clean the URL
          window.history.replaceState({}, "", url.pathname);
          if (!cancelled) setPhase("set-password");
          return;
        }

        // B) Older flow: #access_token & #refresh_token in hash
        const hashParams = parseHashParams(window.location.hash);
        const access_token = hashParams["access_token"];
        const refresh_token = hashParams["refresh_token"];

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) throw error;
          // Clean the URL
          window.history.replaceState({}, "", url.pathname);
          if (!cancelled) setPhase("set-password");
          return;
        }

        // If we got here, nothing to exchange
        throw new Error("Link non valido o scaduto.");
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? "Errore durante la verifica del link.");
          setPhase("error");
        }
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [location.key]);

  // 2) Submit new password
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("La password deve contenere almeno 8 caratteri.");
      return;
    }
    if (password !== confirm) {
      setError("Le password non coincidono.");
      return;
    }
    setError(null);
    setPhase("saving");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setPhase("set-password");
      return;
    }
    setPhase("done");
    // small pause then go to app login/home
    setTimeout(() => navigate("/", { replace: true }), 800);
  };

  // ---- UI ----
  if (phase === "verifying") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Verifica invito…</div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-black mb-2">Link non valido</h1>
          <p className="text-gray-600 mb-4">
            {error || "Si è verificato un errore durante la verifica del link."}
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full rounded-xl bg-black text-white py-3 hover:bg-gray-800 transition"
          >
            Torna al login
          </button>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="text-black font-medium">Password impostata! 🎉</div>
        </div>
      </div>
    );
  }

  // set-password / saving
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-black mb-2">Imposta la tua password</h1>
        <p className="text-gray-600 mb-6">
          Completa l'invito impostando una nuova password per il tuo account.
        </p>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Nuova password</label>
            <input
              type="password"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 caratteri"
              autoComplete="new-password"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Conferma password</label>
            <input
              type="password"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Ripeti la password"
              autoComplete="new-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={phase === "saving"}
            className="w-full rounded-xl bg-black text-white py-3 hover:bg-gray-800 transition disabled:opacity-60"
          >
            {phase === "saving" ? "Salvataggio…" : "Imposta password"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="w-full mt-2 rounded-xl bg-gray-100 text-gray-800 py-3 hover:bg-gray-200 transition"
          >
            Annulla
          </button>
        </form>
      </div>
    </div>
  );
}