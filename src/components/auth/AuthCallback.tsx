import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";

/**
 * AuthCallback
 * - Consumes Supabase invite/magic/recovery/OAuth tokens from URL
 * - Establishes a browser session
 * - Redirects to ?next=... or /complete-account
 * - On failure → /auth/error
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);

  // Determine the target after successful session setup
  const next = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const n = params.get("next");
    return n && n.startsWith("/") ? n : "/complete-account";
  }, [location.search]);

  useEffect(() => {
  const run = async () => {
    try {
      // 0) If we ALREADY have a session, just continue (no need for tokens)
      const { data: s0 } = await supabase.auth.getSession();
      const session0 = s0.session;
      const url = new URL(window.location.href);
      const nextParam = url.searchParams.get("next");
      const next = nextParam && nextParam.startsWith("/") ? nextParam : "/complete-account";

      if (session0) {
        // Clean URL then go forward
        url.hash = "";
        url.search = nextParam ? `?next=${encodeURIComponent(nextParam)}` : "";
        window.history.replaceState({}, document.title, url.toString());
        navigate(next, { replace: true });
        return;
      }

      // 1) No session → try to create one from URL tokens
      const hasCode = url.searchParams.get("code");
      const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
      const hp = new URLSearchParams(hash);
      const accessToken = hp.get("access_token");
      const refreshToken = hp.get("refresh_token");

      let establishErr: string | null = null;

      if (hasCode) {
        const { error } = await supabase.auth.exchangeCodeForSession(url.searchParams.get("code")!);
        if (error) establishErr = error.message;
      } else if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (error) establishErr = error.message;
      } else {
        establishErr = "Missing auth parameters.";
      }

      // 2) If token flow failed, check again: maybe session was created anyway
      const { data: s1 } = await supabase.auth.getSession();
      if (s1.session) {
        url.hash = "";
        url.search = nextParam ? `?next=${encodeURIComponent(nextParam)}` : "";
        window.history.replaceState({}, document.title, url.toString());
        navigate(next, { replace: true });
        return;
      }

      if (establishErr) {
        navigate("/auth/error", { replace: true });
        return;
      }

      // 3) Success → clean URL and continue
      url.hash = "";
      url.search = nextParam ? `?next=${encodeURIComponent(nextParam)}` : "";
      window.history.replaceState({}, document.title, url.toString());
      navigate(next, { replace: true });
    } catch {
      navigate("/auth/error", { replace: true });
    }
  };

  run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50">
      <div className="w-full max-w-sm bg-white p-6 rounded-xl shadow text-center">
        <div className="animate-pulse text-gray-700 mb-2">Verifica in corso…</div>
        <div className="text-sm text-gray-500">
          Stiamo completando l’accesso in modo sicuro.
          {error ? <div className="mt-3 text-red-600">{error}</div> : null}
        </div>
      </div>
    </div>
  );
}