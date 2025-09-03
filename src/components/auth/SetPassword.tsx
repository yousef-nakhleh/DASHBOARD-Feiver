// src/components/auth/SetPassword.tsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";

const SetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  // Basic guard: user must arrive with a valid session (came from invite/callback)
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        // No session -> send user to login or re-click invite link
        navigate("/login", { replace: true });
      }
    })();
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password || password.length < 8) {
      setError("La password deve avere almeno 8 caratteri.");
      return;
    }
    if (password !== confirm) {
      setError("Le password non coincidono.");
      return;
    }

    try {
      setWorking(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      // Optional: refresh session to be safe
      await supabase.auth.getSession();

      setOk(true);
      // Small delay then go to app root (or business selector)
      setTimeout(() => navigate("/", { replace: true }), 800);
    } catch (err: any) {
      setError(err?.message || "Errore durante l’aggiornamento della password.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-black mb-2">Imposta password</h1>
        <p className="text-gray-600 mb-6">
          Completa l’attivazione impostando una nuova password.
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm">
            {error}
          </div>
        )}

        {ok && (
          <div className="mb-4 rounded-lg bg-green-50 text-green-700 px-4 py-2 text-sm">
            Password aggiornata! Reindirizzamento…
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nuova password
            </label>
            <input
              type="password"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-black"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimo 8 caratteri"
              autoComplete="new-password"
              disabled={working || ok}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Conferma password
            </label>
            <input
              type="password"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-black"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              disabled={working || ok}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white px-4 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            disabled={working || ok}
          >
            {working ? "Salvataggio…" : "Imposta password"}
          </button>
        </form>

        <button
          onClick={() => navigate("/login")}
          className="mt-4 w-full text-sm text-gray-600 hover:text-black underline"
          disabled={working}
        >
          Torna al login
        </button>
      </div>
    </div>
  );
};

export default SetPassword;