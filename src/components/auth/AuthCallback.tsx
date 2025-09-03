// src/components/auth/AuthCallback.tsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

/**
 * Handles Supabase auth redirects:
 * - New flow:   ?code=...&type=magiclink|recovery|signup|invite|email_change
 * - Legacy flow:?token_hash=...&type=magiclink|recovery|signup|invite|email_change
 *
 * On success: user session is stored by supabase-js, then we redirect smartly:
 *   - invite/signup OR no memberships → /auth/invite (set password / onboarding)
 *   - otherwise → "/"
 */
const AuthCallback: React.FC = () => {
  const { search } = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"working" | "done" | "error">("working");
  const [message, setMessage] = useState<string>("Completamento autenticazione…");

  useEffect(() => {
    const params = new URLSearchParams(search);
    const code = params.get("code");
    const tokenHash = params.get("token_hash");
    const rawType = (params.get("type") || "").toLowerCase();

    // Normalize the type for legacy verifyOtp
    const normalizedType =
      rawType === "invitation" ? "invite" : rawType; // sometimes Supabase sends 'invitation'

    async function run() {
      try {
        // 1) Establish session
        if (code) {
          setMessage("Verifica codice…");
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (tokenHash && normalizedType) {
          setMessage("Verifica token…");
          const { error } = await supabase.auth.verifyOtp({
            type: normalizedType as
              | "signup"
              | "invite"
              | "magiclink"
              | "recovery"
              | "email_change",
            token_hash: tokenHash,
          });
          if (error) throw error;
        } else {
          throw new Error("Parametri di callback non validi.");
        }

        // 2) Decide destination
        setMessage("Controllo permessi…");
        const { data: userRes } = await supabase.auth.getUser();
        const userId = userRes?.user?.id;

        let hasMembership = false;
        if (userId) {
          const { data: m } = await supabase
            .from("memberships")
            .select("id")
            .eq("user_id", userId)
            .limit(1);
          hasMembership = !!(m && m.length > 0);
        }

        const needsOnboarding =
          normalizedType === "invite" ||
          normalizedType === "signup" ||
          !hasMembership;

        setStatus("done");
        setMessage("Accesso completato. Reindirizzamento…");

        // 🔑 Redirect rule:
        // - invited / signed-up / no membership → to password/onboarding
        // - else → into the app
        const target = needsOnboarding ? "/auth/invite" : "/";
        setTimeout(() => navigate(target, { replace: true }), 400);
      } catch (e: any) {
        setStatus("error");
        setMessage(e?.message || "Errore durante l’autenticazione.");
      }
    }

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow p-8 max-w-md w-full text-center">
        <div
          className={`mx-auto mb-4 h-12 w-12 rounded-full flex items-center justify-center ${
            status === "error" ? "bg-red-100 text-red-700" : "bg-black text-white"
          }`}
        >
          {status === "error" ? "!" : "✓"}
        </div>
        <h1 className="text-xl font-semibold text-black mb-2">
          {status === "error" ? "Autenticazione fallita" : "Autenticazione"}
        </h1>
        <p className="text-gray-600">{message}</p>
        {status === "error" && (
          <button
            onClick={() => (window.location.href = "/login")}
            className="mt-6 px-5 py-2 rounded-xl bg-black text-white hover:bg-gray-800 transition-colors"
          >
            Torna al login
          </button>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;