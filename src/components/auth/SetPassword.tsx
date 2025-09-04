// src/components/auth/SetPassword.tsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";

const SetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // Ensure the invite created a session. If not, send to login.
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate("/login", { replace: true });
      }
    })();
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setOk(null);

    if (!pw || pw.length < 8) {
      setErr("La password deve avere almeno 8 caratteri.");
      return;
    }
    if (pw !== pw2) {
      setErr("Le password non coincidono.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;

      setOk("Password impostata con successo. Ti reindirizziamo alla dashboard…");
      setTimeout(() => navigate("/", { replace: true }), 800);
    } catch (e: any) {
      setErr(e?.message || "Errore impostando la password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-2xl shadow p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-black mb-2">Imposta la password</h1>
        <p className="text-gray-600 mb-6">
          Hai accettato l’invito. Per completare l’accesso imposta una nuova password.
        </p>

        {err && (
          <div className="mb-4 rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">
            {err}
          </div>
        )}
        {ok && (
          <div className="mb-4 rounded-lg bg-green-50 text-green-700 px-4 py-3 text-sm">
            {ok}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nuova password
            </label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-black"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <p className="text-xs text-gray-500 mt-1">Minimo 8 caratteri.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ripeti password
            </label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-black focus:outline-none focus:ring-2 focus:ring-black"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white rounded-xl px-4 py-3 font-medium hover:bg-gray-800 transition-colors disabled:opacity-60"
          >
            {loading ? "Salvataggio…" : "Imposta password"}
          </button>
        </form>

        <button
          onClick={() => navigate("/login")}
          className="w-full mt-4 text-sm text-gray-600 hover:text-black underline"
        >
          Torna al login
        </button>
      </div>
    </div>
  );
};

export default SetPassword;