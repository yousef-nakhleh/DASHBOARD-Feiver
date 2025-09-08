// src/components/auth/BusinessSelector.tsx
import React from "react";
import { useSelectedBusiness } from "./SelectedBusinessProvider";

const BusinessSelector: React.FC = () => {
  const {
    selectedBusinessId,
    setSelectedBusinessId,
    memberships,
    membershipsLoading,
    membershipsError,
  } = useSelectedBusiness();

  // Don’t render while loading or on error
  if (membershipsLoading || membershipsError) return null;

  // No memberships → nothing to select
  if (!memberships || memberships.length === 0) return null;

  const isSuperAdmin = memberships.some((m) => m.role === "super_admin");

  // Hide selector if user has exactly 1 membership and is NOT super_admin
  if (!isSuperAdmin && memberships.length === 1) return null;

  return (
    <div className="mb-4">
      <label
        htmlFor="business-selector"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Seleziona Business
      </label>
      <select
        id="business-selector"
        value={selectedBusinessId || ""}
        onChange={(e) => setSelectedBusinessId(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black"
      >
        <option value="" disabled>
          -- Scegli un business --
        </option>
        {memberships.map((m) => (
          <option key={m.business_id} value={m.business_id}>
            {(m.business?.name ?? m.business_id) + ` (${m.role})`}
          </option>
        ))}
      </select>
    </div>
  );
};

export default BusinessSelector;