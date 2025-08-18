import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useEffect, useState } from "react";

export const usePatientStore = create(
  persist(
    (set, get) => ({
      // Active patient data (can be primary or family member)
      activePatient: null,

      // Primary patient data (the account holder)
      primaryPatient: null,

      // List of all family members
      familyMembers: [],

      // All patients under care (primary + family members)
      allPatientsUnderCare: [],

      // Loading states
      loading: false,
      familyMembersLoading: false,

      // Actions
      setPrimaryPatient: (patient) => set({ primaryPatient: patient }),

      setActivePatient: (patient) => {
        set({ activePatient: patient });
      },

      setFamilyMembers: (members) => {
        const { primaryPatient } = get();
        const allPatients = primaryPatient
          ? [
              {
                ...primaryPatient,
                isPrimary: true,
                relationship: "Usted",
              },
              ...members.map((member) => ({
                ...member,
                isPrimary: false,
              })),
            ]
          : [];

        set({
          familyMembers: members,
          allPatientsUnderCare: allPatients,
        });
      },

      addFamilyMember: (member) => {
        const { familyMembers } = get();
        const updatedMembers = [...familyMembers, member];
        get().setFamilyMembers(updatedMembers);
      },

      updateFamilyMember: (memberId, updatedData) => {
        const { familyMembers, activePatient } = get();
        const updatedMembers = familyMembers.map((member) =>
          member.id === memberId ? { ...member, ...updatedData } : member
        );

        // Update active patient if it's the one being updated
        let newActivePatient = activePatient;
        if (
          activePatient &&
          activePatient.id === memberId &&
          !activePatient.isPrimary
        ) {
          newActivePatient = { ...activePatient, ...updatedData };
        }

        set({ activePatient: newActivePatient });
        get().setFamilyMembers(updatedMembers);
      },

      removeFamilyMember: (memberId) => {
        const { familyMembers, activePatient, primaryPatient } = get();
        const updatedMembers = familyMembers.filter(
          (member) => member.id !== memberId
        );

        // If the removed member was the active patient, switch to primary
        let newActivePatient = activePatient;
        if (activePatient && activePatient.id === memberId) {
          newActivePatient = primaryPatient
            ? { ...primaryPatient, isPrimary: true, relationship: "Usted" }
            : null;
        }

        set({ activePatient: newActivePatient });
        get().setFamilyMembers(updatedMembers);
      },

      // Switch active patient context
      switchToPatient: (patientId) => {
        const { primaryPatient, familyMembers } = get();

        if (patientId === primaryPatient?.id) {
          // Switch to primary patient
          set({
            activePatient: {
              ...primaryPatient,
              isPrimary: true,
              relationship: "Usted",
            },
          });
        } else {
          // Switch to family member
          const familyMember = familyMembers.find(
            (member) => member.id === patientId
          );
          if (familyMember) {
            set({
              activePatient: {
                ...familyMember,
                isPrimary: false,
              },
            });
          }
        }
      },

      // Reset to primary patient
      switchToPrimary: () => {
        const { primaryPatient } = get();
        if (primaryPatient) {
          set({
            activePatient: {
              ...primaryPatient,
              isPrimary: true,
              relationship: "Usted",
            },
          });
        }
      },

      // Check if current active patient is primary
      isActivePrimary: () => {
        const { activePatient } = get();
        return activePatient?.isPrimary === true;
      },

      // Get patient display name with relationship
      getActivePatientDisplayName: () => {
        const { activePatient } = get();
        if (!activePatient) return "";

        if (activePatient.isPrimary) {
          return activePatient.name || "Usted";
        } else {
          return `${activePatient.name} (${activePatient.relationship})`;
        }
      },

      // Clear all data (for logout)
      clearPatientData: () =>
        set({
          activePatient: null,
          primaryPatient: null,
          familyMembers: [],
          allPatientsUnderCare: [],
          loading: false,
          familyMembersLoading: false,
        }),

      // Set loading states
      setLoading: (loading) => set({ loading }),
      setFamilyMembersLoading: (loading) =>
        set({ familyMembersLoading: loading }),

      // Initialize with primary patient data
      initializePatientData: (primaryPatientData, familyMembersData = []) => {
        const { activePatient } = get();
        
        const primaryWithMeta = {
          ...primaryPatientData,
          isPrimary: true,
          relationship: "Usted",
        };

        const allPatients = [
          primaryWithMeta,
          ...familyMembersData.map((member) => ({
            ...member,
            isPrimary: false,
          })),
        ];

        // Check if current activePatient is still valid
        let newActivePatient = primaryWithMeta; // Default to primary
        
        if (activePatient) {
          if (activePatient.isPrimary && activePatient.id === primaryPatientData.id) {
            // Primary patient is still valid
            newActivePatient = primaryWithMeta;
          } else if (!activePatient.isPrimary) {
            // Check if family member still exists
            const familyMemberExists = familyMembersData.some(
              member => member.id === activePatient.id
            );
            if (familyMemberExists) {
              // Family member still exists, keep the selection
              newActivePatient = {
                ...familyMembersData.find(member => member.id === activePatient.id),
                isPrimary: false,
              };
            }
            // If family member doesn't exist anymore, fall back to primary
          }
        }

        set({
          primaryPatient: primaryPatientData,
          activePatient: newActivePatient,
          familyMembers: familyMembersData,
          allPatientsUnderCare: allPatients,
        });
      },

      // Get active patient for appointments/medical records
      getActivePatientForServices: () => {
        const { activePatient } = get();
        if (!activePatient) return null;

        return {
          id: activePatient.id,
          name: activePatient.name,
          email: activePatient.email,
          phone: activePatient.phone,
          dateOfBirth: activePatient.dateOfBirth,
          gender: activePatient.gender,
          isPrimary: activePatient.isPrimary,
          relationship: activePatient.relationship,
          // For family members, we need to reference the primary patient for doctor relationship
          doctorId: activePatient.isPrimary
            ? activePatient.doctorId
            : activePatient.doctorId,
          primaryPatientId: activePatient.isPrimary
            ? activePatient.id
            : activePatient.primaryPatientId,
        };
      },
    }),
    {
      name: "patient-store", // key for localStorage
      storage: createJSONStorage(() => localStorage),
      // Only persist essential data, not loading states
      partialize: (state) => ({
        activePatient: state.activePatient,
        primaryPatient: state.primaryPatient,
        familyMembers: state.familyMembers,
        allPatientsUnderCare: state.allPatientsUnderCare,
      }),
    }
  )
);

// Hook to handle hydration
export const usePatientStoreHydrated = () => {
  const store = usePatientStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Check if we're on the client side
    if (typeof window !== "undefined") {
      // Simple check: if we have data in the store, consider it hydrated
      // Or check if localStorage has the patient-store key
      const hasStoredData = localStorage.getItem("patient-store");
      if (hasStoredData || store.activePatient) {
        setIsHydrated(true);
      } else {
        // Set a slight delay to allow for hydration
        const timer = setTimeout(() => setIsHydrated(true), 100);
        return () => clearTimeout(timer);
      }
    }
  }, [store.activePatient]);

  return { ...store, isHydrated };
};
