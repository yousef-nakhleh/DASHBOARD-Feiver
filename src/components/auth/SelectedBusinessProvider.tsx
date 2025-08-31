// src/components/auth/SelectedBusinessProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

type SelectedBusinessContextType = {
  /** Explicitly chosen by the user (via BusinessSelector). May be null. */
  selectedBusinessId: string | null;
  /** Set a new selection (persisted per user). Pass null to clear selection. */
  setSelectedBusinessId: (id: string | null) => void;
  /**
   * The business id the rest of the app should actually use:
   * - selectedBusinessId if set
   * - otherwise the membership business_id from AuthContext
   * - otherwise null
   */
  effectiveBusinessId: string | null;
};

const SelectedBusinessContext = createContext<SelectedBusinessContextType | undefined>(undefined);

export const SelectedBusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, loading: authLoading } = useAuth();

  // Persist selection per user so super_admins/multi-tenant users keep their choice across reloads
  const storageKey = profile?.id ? `sb_selected_business_${profile.id}` : null;

  const [selectedBusinessId, _setSelectedBusinessId] = useState<string | null>(null);

  // Load any saved selection when user changes
  useEffect(() => {
    if (authLoading) return;
    if (!storageKey) {
      _setSelectedBusinessId(null);
      return;
    }
    const saved = window.localStorage.getItem(storageKey);
    _setSelectedBusinessId(saved ? saved : null);
  }, [authLoading, storageKey]);

  // If there is no explicit selection, fall back to membership business_id
  const effectiveBusinessId = useMemo(() => {
    return selectedBusinessId ?? profile?.business_id ?? null;
  }, [selectedBusinessId, profile?.business_id]);

  // Public setter that also persists
  const setSelectedBusinessId = (id: string | null) => {
    _setSelectedBusinessId(id);
    if (!storageKey) return;
    if (id) window.localStorage.setItem(storageKey, id);
    else window.localStorage.removeItem(storageKey);
  };

  const value = useMemo<SelectedBusinessContextType>(
    () => ({ selectedBusinessId, setSelectedBusinessId, effectiveBusinessId }),
    [selectedBusinessId, effectiveBusinessId]
  );

  return (
    <SelectedBusinessContext.Provider value={value}>
      {children}
    </SelectedBusinessContext.Provider>
  );
};

export const useSelectedBusiness = (): SelectedBusinessContextType => {
  const ctx = useContext(SelectedBusinessContext);
  if (!ctx) throw new Error('useSelectedBusiness must be used within a SelectedBusinessProvider');
  return ctx;
};