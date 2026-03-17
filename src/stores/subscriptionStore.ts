import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type PlanTier = 'free' | 'medium' | 'plus';

const TTL_MS = 60 * 60 * 1000; // 1 hour

interface SubscriptionState {
  userId: string | null;
  planTier: PlanTier;
  expiresAt: string | null; // ISO string, null = no expiry (free / unlimited)
  fetchedAt: number | null;
}

interface SubscriptionActions {
  setSubscription: (userId: string, planTier: PlanTier, expiresAt: string | null) => void;
  clearSubscription: () => void;
  /** Returns true if cache is valid for the given userId */
  isValid: (userId: string) => boolean;
}

const initialState: SubscriptionState = {
  userId: null,
  planTier: 'free',
  expiresAt: null,
  fetchedAt: null,
};

export const useSubscriptionStore = create<SubscriptionState & SubscriptionActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setSubscription(userId, planTier, expiresAt) {
        set({ userId, planTier, expiresAt, fetchedAt: Date.now() });
      },

      clearSubscription() {
        set(initialState);
      },

      isValid(userId) {
        const { userId: cachedId, fetchedAt } = get();
        if (!cachedId || !fetchedAt) return false;
        if (cachedId !== userId) return false;
        return Date.now() - fetchedAt < TTL_MS;
      },
    }),
    {
      name: 'doctor-subscription',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
        }
        return localStorage;
      }),
      partialize: (state) => ({
        userId: state.userId,
        planTier: state.planTier,
        expiresAt: state.expiresAt,
        fetchedAt: state.fetchedAt,
      }),
    },
  ),
);
