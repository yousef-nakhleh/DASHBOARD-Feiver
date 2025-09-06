import React, { useEffect, useState, PropsWithChildren } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

/**
 * Wrap your /dashboard routes with <MembershipGuard>.
 * - If NO session → /login
 * - If session BUT NO memberships → /pending-access
 * - If session + memberships → render children (dashboard)
 */
export default function MembershipGuard({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const location = useLocation();

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const run = async () => {
      // 1) Require session
      const { data: s } = await supabase.auth.getSession();
      const session = s.session;
      if (!session) {
        // preserve attempted location for after-login redirect if you want
        navigate("/login", { replace: true, state: { from: location.pathname } });
        return;
      }

      // 2) Check memberships for this user
     const { data: row, error } = await supabase
  .from("memberships")
  .select("user_id,business_id,role")
  .eq("user_id", session.user.id)
  .maybeSingle();

      if (error) {
        console.error("Membership check failed:", error.message);
        navigate("/auth/error", { replace: true });
        return;
      }

      if (!rows || rows.length === 0) {
        navigate("/pending-access", { replace: true });
        return;
      }

      // 3) Allowed
      setAllowed(true);
      setChecking(false);
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking && !allowed) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50">
        <div className="w-full max-w-sm bg-white p-6 rounded-xl shadow text-center">
          <div className="animate-pulse text-gray-700 mb-2">Verifica accesso…</div>
          <div className="text-sm text-gray-500">Controllo dei permessi di accesso alla dashboard.</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}