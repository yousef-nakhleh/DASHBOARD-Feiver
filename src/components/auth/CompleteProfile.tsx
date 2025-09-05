import React, { useEffect, useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

type Profile = {
  user_id: string;
  full_name?: string | null;
  account_completed?: boolean | null;
};

export default function CompleteProfile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [existingCompleted, setExistingCompleted] = useState(false);

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1) Ensure session exists; preload current profile
  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) {
        navigate("/login", { replace: true });
        return;
      }
      setHasSession(true);

      // Fetch profile to detect if already completed (idempotent behavior)
      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("user_id, full_name, account_completed")
        .eq("user_id", session.user.id)
        .maybeSingle<Profile>();

      if (profErr && profErr.code !== "PGRST116") {
        // ignore "No rows" (PGRST116). Any other error: show but still allow form.
        console.warn("profile fetch error:", profErr.message);
      }

      if (prof?.account_completed) {
        setExistingCompleted(true);
        // If already completed, skip form and continue to dashboard
        navigate("/dashboard", { replace: true });
        return;
      }

      // Prefill name if exists
      if (prof?.full_name) setFullName(prof.full_name);

      setLoading(false);
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) Handle submit: set password + upsert profile + mark completed
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasSession) {
      setError("Sessione non trovata. Accedi nuovamente.");
      navigate("/login", { replace: true });
      return;
    }

    if (password.length < 8) {
      setError("La password deve contenere almeno 8 caratteri.");
      return;
    }
    if (password !== password2) {
      setError("Le password non coincidono.");
      return;
    }

    setSubmitting(true);

    // A) Set initial password for the current authenticated user
    const { error: pwErr } = await supabase.auth.updateUser({ password });
    if (pwErr) {
      setSubmitting(false);
      setError(pwErr.message || "Impossibile aggiornare la password.");
      return;
    }

    // B) Upsert profile (idempotent); mark as completed
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user.id;
    if (!uid) {
      setSubmitting(false);
      setError("Sessione scaduta. Accedi nuovamente.");
      navigate("/login", { replace: true });
      return;
    }

    const { error: upsertErr } = await supabase.from("profiles").upsert(
      {
        user_id: uid,
        full_name: fullName || null,
        account_completed: true,
        // add other default profile fields here if needed
      },
      { onConflict: "user_id" }
    );

    if (upsertErr) {
      setSubmitting(false);
      setError(upsertErr.message || "Errore durante il salvataggio del profilo.");
      return;
    }

    // C) Done → proceed to dashboard; MembershipGuard will route to Pending if needed
    navigate("/dashboard", { replace: true });
  };

  if (loading && !existingCompleted) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50">
        <div className="w-full max-w-sm bg-white p-6 rounded-xl shadow text-center">
          <div className="animate-pulse text-gray-700 mb-2">Caricamento…</div>
          <div className="text-sm text-gray-500">Preparazione della pagina di completamento account.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 bg-white p-6 rounded-xl shadow"
      >
        <h1 className="text-xl font-semibold text-gray-900">
          Completa il tuo account
        </h1>
        <p className="text-sm text-gray-600">
          Imposta la tua password e aggiorna le informazioni di base del profilo.
        </p>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>
        )}

        {/* Optional display name */}
        <div className="space-y-1">
          <label className="block text-sm text-gray-700">Nome e cognome (opzionale)</label>
          <input
            type="text"
            className="w-full border rounded-lg px-3 py-2"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Mario Rossi"
            autoComplete="name"
          />
        </div>

        {/* Password fields */}
        <div className="space-y-1">
          <label className="block text-sm text-gray-700">Password</label>
          <input
            type="password"
            className="w-full border rounded-lg px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Almeno 8 caratteri"
            autoComplete="new-password"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm text-gray-700">Conferma password</label>
          <input
            type="password"
            className="w-full border rounded-lg px-3 py-2"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            placeholder="Ripeti la password"
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-black text-white py-2 disabled:opacity-60"
        >
          {submitting ? "Salvataggio…" : "Conferma e continua"}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Dopo il completamento verrai indirizzato alla dashboard.
        </p>
      </form>
    </div>
  );
}