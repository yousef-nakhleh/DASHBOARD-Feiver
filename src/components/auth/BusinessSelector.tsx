// src/components/auth/BusinessSelector.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from './AuthContext';
import { useSelectedBusiness } from './SelectedBusinessProvider';

interface Membership {
  business_id: string;
  role: string;
  business: {
    id: string;
    name: string;
  };
}

const BusinessSelector: React.FC = () => {
  const { profile } = useAuth();
  const { selectedBusinessId, setSelectedBusinessId } = useSelectedBusiness();

  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMemberships = async () => {
      if (!profile) return;

      setLoading(true);
      const { data, error } = await supabase
        .from('memberships')
        .select('business_id, role, business:business(id, name)')
        .eq('user_id', profile.id);

      if (error) {
        console.error('Error fetching memberships:', error);
        setMemberships([]);
      } else {
        setMemberships(data || []);
        // Auto-select if only 1 membership
        if (data && data.length === 1) {
          setSelectedBusinessId(data[0].business_id);
        }
      }

      setLoading(false);
    };

    fetchMemberships();
  }, [profile, setSelectedBusinessId]);

  // Don’t render if still loading or no memberships
  if (loading || memberships.length === 0) return null;

  // Show selector if:
  // - super_admin (sees all memberships)
  // - OR user has >1 businesses
  if (
    memberships.length === 1 &&
    memberships[0].role !== 'super_admin'
  ) {
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
        value={selectedBusinessId || ''}
        onChange={(e) => setSelectedBusinessId(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black"
      >
        <option value="" disabled>
          -- Scegli un business --
        </option>
        {memberships.map((m) => (
          <option key={m.business_id} value={m.business_id}>
            {m.business?.name || m.business_id} ({m.role})
          </option>
        ))}
      </select>
    </div>
  );
};

export default BusinessSelector;