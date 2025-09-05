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
        // Parse both query (?code=...) and hash (#access_token=...&refresh_token=...)
        const url = new URL(window.location.href);
        const hasCode = url.searchParams.get("code");
        const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        let establishErr: string | null = null;

        if (hasCode) {
          // New-style links (OTP/OAuth) → exchange code for session
          const { error } = await supabase.auth.exchangeCodeForSession(url.searchParams.get("code")!);
          if (error) establishErr = error.message;
        } else if (accessToken && refreshToken) {
          // Legacy hash tokens → set session directly
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) establishErr = error.message;
        } else {
          establishErr = "Missing auth parameters.";
        }

        if (establishErr) {
          setError(establishErr);
          // small delay so the message is visible if you show this page briefly
          setTimeout(() => navigate("/auth/error", { replace: true }), 300);
          return;
        }

        // Clean up URL (remove tokens) before navigating
        try {
          const cleanUrl = new URL(window.location.href);
          cleanUrl.hash = "";
          // keep only "next" if present
          const onlyNext = new URLSearchParams(cleanUrl.search);
          const keep = onlyNext.get("next");
          cleanUrl.search = keep ? `?next=${encodeURIComponent(keep)}` : "";
          window.history.replaceState({}, document.title, cleanUrl.toString());
        } catch {
          // no-op if URL API fails (older browsers)
        }

        navigate(next, { replace: true });
      } catch (e: any) {
        setError(e?.message || "Unexpected error.");
        setTimeout(() => navigate("/auth/error", { replace: true }), 300);
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