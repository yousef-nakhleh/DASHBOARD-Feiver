// src/components/auth/BusinessSelector.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "./AuthContext";
import { useSelectedBusiness } from "./SelectedBusinessProvider";

type Membership = {
  business_id: string;
  role: string;
  business: {
    id: string;
    name: string;
  } | null;
};

const BusinessSelector: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { selectedBusinessId, setSelectedBusinessId } = useSelectedBusiness();

  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchMemberships = async () => {
      if (authLoading) return;
      if (!user?.id) {
        setMemberships([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from("memberships")
        .select("business_id, role, business:business(id, name)")
        .eq("user_id", user.id);

      if (cancelled) return;

      if (error) {
        console.error("Error fetching memberships:", error);
        setMemberships([]);
      } else {
        const rows = (data as Membership[]) || [];
        setMemberships(rows);

        // Auto-select if only one membership and nothing chosen yet
        if (rows.length === 1 && !selectedBusinessId) {
          setSelectedBusinessId(rows[0].business_id);
        }
      }

      setLoading(false);
    };

    fetchMemberships();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.id, selectedBusinessId, setSelectedBusinessId]);

  // Don’t render selector while loading or if user has no memberships
  if (loading || memberships.length === 0) return null;

  // Hide selector if user has exactly 1 membership and is not super_admin
  if (memberships.length === 1 && memberships[0].role !== "super_admin") {
    return null;
  }

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