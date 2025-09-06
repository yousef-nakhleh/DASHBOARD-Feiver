import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function MembershipGuard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const run = async () => {
      // 1) Require session (RequireAuth should have done this, but be safe)
      const { data: s } = await supabase.auth.getSession();
      const session = s.session;
      if (!session) {
        navigate("/login", { replace: true, state: { from: location.pathname } });
        return;
      }

      // 2) Check memberships
      const { data: membership, error } = await supabase
        .from("memberships")
        .select("business_id, role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Membership check failed:", error.message);
        navigate("/auth/error", { replace: true });
        return;
      }

      if (!membership) {
        navigate("/pending-access", { replace: true });
        return;
      }

      setChecking(false);
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50">
        <div className="w-full max-w-sm bg-white p-6 rounded-xl shadow text-center">
          <div className="animate-pulse text-gray-700 mb-2">Verifica accesso…</div>
          <div className="text-sm text-gray-500">Controllo dei permessi di accesso alla dashboard.</div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}