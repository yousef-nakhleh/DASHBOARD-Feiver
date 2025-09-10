// src/superadmin/SuperAdmin.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BusinessSelector from "@/components/auth/BusinessSelector";
import { useSelectedBusiness } from "@/components/auth/SelectedBusinessProvider";
import ConfirmLogoutModal from "@/components/auth/ConfirmLogoutModal"; // <-- same modal you use elsewhere
import { supabase } from '../lib/supabase';

const SuperAdmin: React.FC = () => {
  const navigate = useNavigate();

  const {
    selectedBusinessId,
    setSelectedBusinessId,
    memberships,
    membershipsLoading,
    membershipsError,
  } = useSelectedBusiness();

  const [showLogout, setShowLogout] = useState(false);

  const handleEnter = () => {
    if (!selectedBusinessId) return;
    // We already set it via BusinessSelector; just go to the app shell
    navigate("/");
  };

  const handleExit = () => {
    // Clear tenant context and remain in Super Admin space
    setSelectedBusinessId(null);
    // Ensure we are in super admin home
    navigate("/superadmin");
  };

  const disabledEnter =
    !selectedBusinessId || membershipsLoading || !!membershipsError;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-black">Super Admin Panel</h1>
            <p className="text-sm text-gray-500">
              Gestisci globalmente i business. Seleziona e “entra” per operare
              come amministratore di quel business.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLogout(true)}
              className="px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Selector card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-black mb-1">Business Selector</h2>
          <p className="text-sm text-gray-600 mb-4">
            Scegli il business e poi clicca “Entra nel dashboard”.
          </p>

          <div className="max-w-md">
            <BusinessSelector />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleEnter}
              disabled={disabledEnter}
              className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50"
            >
              Entra nel dashboard
            </button>
            <button
              onClick={handleExit}
              className="px-4 py-2 rounded-xl bg-gray-100 text-gray-800 hover:bg-gray-200"
            >
              Torna al Super Admin (clear)
            </button>
          </div>

          {/* Status */}
          <div className="mt-4 text-sm text-gray-500">
            {membershipsLoading && "Caricamento businesses…"}
            {membershipsError && (
              <span className="text-red-600">Errore: {membershipsError}</span>
            )}
            {!membershipsLoading && !membershipsError && memberships.length === 0 && (
              <span>Nessun business disponibile.</span>
            )}
          </div>
        </div>

        {/* Placeholders for future features */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-black mb-2">
            Funzionalità Super Admin
          </h2>
          <div className="border border-dashed border-gray-300 p-4 rounded-lg text-gray-500">
            [Inviti, gestione business, feature flags — in arrivo]
          </div>
        </div>
      </div>

      {/* Logout modal (reused) */}
      {showLogout && (
        <ConfirmLogoutModal
  isOpen={showLogout}
  onCancel={() => setShowLogout(false)}
  onConfirm={async () => {
    setShowLogout(false);
    await supabase.auth.signOut();
    // clear any selected tenant too (optional)
    setSelectedBusinessId(null);
    navigate("/login", { replace: true });
  }}
        />
      )}
    </div>
  );
};

export default SuperAdmin;