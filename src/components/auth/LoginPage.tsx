// src/components/auth/LoginPage.tsx
import React, { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";

type Mode = "login" | "signup";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation() as any;

  const initialMode: Mode = useMemo(() => {
    // allow /login?mode=signup
    const params = new URLSearchParams(location?.search || "");
    const m = params.get("mode");
    return m === "signup" ? "signup" : "login";
  }, [location?.search]);

  const [mode, setMode] = useState<Mode>(initialMode);

  // shared
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // signup-only fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [phone, setPhone]         = useState("");
  const [confirm, setConfirm]     = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [info, setInfo]       = useState<string | null>(null);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setInfo(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Let the existing app flow take over (RequireAuth + BusinessGate)
      const redirectTo = location?.state?.from?.pathname || "/";
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      setError(err?.message ?? "Errore di accesso.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!email || !password) return setError("Email e password sono obbligatorie.");
    if (password.length < 8)  return setError("La password deve avere almeno 8 caratteri.");
    if (password !== confirm) return setError("Le password non coincidono.");

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // store a bit of profile info as user metadata (totally optional)
          data: {
            first_name: firstName || null,
            last_name: lastName || null,
            phone: phone || null,
          },
          // where Supabase sends the user after clicking the confirm link
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      if (error) throw error;

      setInfo(
        "Registrazione inviata. Controlla la tua email e conferma l’indirizzo per poter effettuare il login."
      );
      // keep fields so the user can switch to login right away if already confirmed
    } catch (err: any) {
      setError(err?.message ?? "Errore durante la registrazione.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold text-black mb-2">
          {mode === "login" ? "Accedi" : "Crea un account"}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {mode === "login"
            ? "Inserisci le tue credenziali per accedere."
            : "Compila i campi per registrarti. Riceverai una mail di conferma."}
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

        <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-3">
          {mode === "signup" && (
            <>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Nome"
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Cognome</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Cognome"
                  autoComplete="family-name"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@azienda.it"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          {mode === "signup" && (
            <>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Conferma Password</label>
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

              <div>
                <label className="block text-sm text-gray-700 mb-1">Numero di telefono (opz.)</label>
                <input
                  type="tel"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+39 333 1234567"
                  autoComplete="tel"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-black px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            {loading ? "Attendere…" : mode === "login" ? "Accedi" : "Registrati"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          {mode === "login" ? (
            <>
              Non hai un account?{" "}
              <button
                className="text-black underline underline-offset-2"
                onClick={() => switchMode("signup")}
              >
                Registrati
              </button>
            </>
          ) : (
            <>
              Hai già un account?{" "}
              <button
                className="text-black underline underline-offset-2"
                onClick={() => switchMode("login")}
              >
                Accedi
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}