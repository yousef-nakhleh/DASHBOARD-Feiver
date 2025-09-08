// src/components/auth/MembershipGate.tsx
import React, { useEffect } from "react";
import { useSelectedBusiness } from "./SelectedBusinessProvider";
import BusinessSelector from "./BusinessSelector";

const MembershipGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    memberships,
    membershipsLoading,
    membershipsError,
    selectedBusinessId,
    setSelectedBusinessId,
  } = useSelectedBusiness();

  useEffect(() => {
    if (membershipsLoading || membershipsError) return;

    // Auto-select when only 1 non-super-admin membership
    if (
      memberships.length === 1 &&
      memberships[0].role !== "super_admin" &&
      !selectedBusinessId
    ) {
      setSelectedBusinessId(memberships[0].business_id);
    }
  }, [memberships, membershipsLoading, membershipsError, selectedBusinessId, setSelectedBusinessId]);

  if (membershipsLoading) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-600">
        Caricamento...
      </div>
    );
  }

  if (membershipsError) {
    return (
      <div className="h-screen flex items-center justify-center text-red-600">
        Errore: {membershipsError}
      </div>
    );
  }

  if (!memberships || memberships.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center text-gray-600">
        Nessuna appartenenza trovata. Contatta l&apos;amministratore.
      </div>
    );
  }

  const isSuperAdmin = memberships.some((m) => m.role === "super_admin");

  // Case: multiple memberships OR super_admin → force selector before dashboard
  if ((isSuperAdmin || memberships.length > 1) && !selectedBusinessId) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded-2xl shadow-md w-96">
          <h2 className="text-lg font-bold mb-4 text-black">Seleziona un Business</h2>
          <BusinessSelector />
        </div>
      </div>
    );
  }

  // Otherwise: show the app
  return <>{children}</>;
};

export default MembershipGate;