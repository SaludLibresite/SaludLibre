'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import type { FamilyMember } from '@/src/modules/patients/domain/FamilyMemberEntity';

interface FamilyContextValue {
  familyMembers: FamilyMember[];
  selectedMember: FamilyMember | null; // null = primary patient (self)
  setSelectedMember: (member: FamilyMember | null) => void;
  loading: boolean;
  reload: () => void;
}

const FamilyContext = createContext<FamilyContextValue>({
  familyMembers: [],
  selectedMember: null,
  setSelectedMember: () => {},
  loading: false,
  reload: () => {},
});

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchFamily = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/patients/me/family', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFamilyMembers(data.members ?? []);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFamily();
  }, [fetchFamily]);

  // If selected member is no longer in the list, reset to self
  useEffect(() => {
    if (selectedMember && !familyMembers.find((m) => m.id === selectedMember.id)) {
      setSelectedMember(null);
    }
  }, [familyMembers, selectedMember]);

  return (
    <FamilyContext.Provider
      value={{ familyMembers, selectedMember, setSelectedMember, loading, reload: fetchFamily }}
    >
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  return useContext(FamilyContext);
}
