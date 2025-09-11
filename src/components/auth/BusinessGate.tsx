// src/components/auth/BusinessGate.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import { useSelectedBusiness } from "./SelectedBusinessProvider";
import BusinessSelector from "./BusinessSelector";
import SuperAdmin from "@/superadmin/SuperAdmin";
import { FeaturesProvider } from "@/features/FeaturesProvider";
import Layout from "@/components/Layout";

export default function BusinessGate() {
  const {
    effectiveBusinessId,
    memberships,
    membershipsLoading,
    membershipsError,
    isSuperAdmin,
  } = useSelectedBusiness();

  if (membershipsLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50">
        <div className="w-full max-w-sm bg-white p-6 rounded-xl shadow text-center">
          <div className="animate-pulse text-gray-700 mb-2">Caricamento…</div>
          <div className="text-sm text-gray-500">Recupero aziende disponibili.</div>
        </div>
      </div>
    );
  }

  if (membershipsError) {
    return (
      <div className="min-h-screen grid place-items-center">
        <p className="text-red-600 font-medium">Errore: {membershipsError}</p>
      </div>
    );
  }

  // Super admin: land on panel until a business is chosen
  if (isSuperAdmin && !effectiveBusinessId) return <SuperAdmin />;

  // Non-super with multiple memberships and nothing chosen → selector page
  if (!isSuperAdmin && memberships.length > 1 && !effectiveBusinessId) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white p-6 rounded-2xl shadow">
          <h1 className="text-xl font-bold text-black mb-2">Seleziona Business</h1>
          <p className="text-sm text-gray-600 mb-4">Scegli l’azienda con cui lavorare.</p>
          <BusinessSelector />
        </div>
      </div>
    );
  }

  // Have a business selected → mount tenant app
  if (effectiveBusinessId) {
    return (
      <FeaturesProvider businessId={effectiveBusinessId}>
        <Layout>
          <Outlet />
        </Layout>
      </FeaturesProvider>
    );
  }

  // No memberships
  return (
    <div className="min-h-screen grid place-items-center">
      <p className="text-gray-700 font-semibold">Nessun business associato.</p>
    </div>
  );
}