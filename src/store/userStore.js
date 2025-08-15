import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useUserStore = create(
  persist(
    (set, get) => ({
      // User type: 'doctor', 'patient', 'superadmin', or null
      userType: null,

      // User profile data
      userProfile: null,

      // Loading state
      loading: false,

      // Actions
      setUserType: (type) => set({ userType: type }),

      setUserProfile: (profile) => set({ userProfile: profile }),

      setUserData: (type, profile) => set({ 
        userType: type, 
        userProfile: profile 
      }),

      setLoading: (loading) => set({ loading }),

      // Clear user data on logout
      clearUserData: () => set({ 
        userType: null, 
        userProfile: null,
        loading: false 
      }),

      // Check if user is doctor
      isDoctor: () => get().userType === 'doctor',

      // Check if user is patient
      isPatient: () => get().userType === 'patient',

      // Check if user is superadmin
      isSuperAdmin: () => get().userType === 'superadmin',

      // Get user dashboard URL based on type
      getDashboardUrl: () => {
        const userType = get().userType;
        switch (userType) {
          case 'doctor':
            return '/admin';
          case 'patient':
            return '/paciente/dashboard';
          case 'superadmin':
            return '/superadmin';
          default:
            return '/';
        }
      },

      // Get user login URL based on type
      getLoginUrl: () => {
        const userType = get().userType;
        switch (userType) {
          case 'doctor':
          case 'superadmin':
            return '/auth/login';
          case 'patient':
            return '/paciente/login';
          default:
            return '/paciente/login'; // Default to patient login
        }
      }
    }),
    {
      name: "user-storage", // Storage key
      partialize: (state) => ({ 
        userType: state.userType,
        userProfile: state.userProfile 
      }), // Only persist these fields
    }
  )
);
