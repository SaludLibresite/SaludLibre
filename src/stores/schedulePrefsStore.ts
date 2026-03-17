import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type ViewMode = 'calendar' | 'list';
type FilterKey = 'upcoming' | 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface SchedulePrefsState {
  view: ViewMode;
  filter: FilterKey;
}

interface SchedulePrefsActions {
  setView: (view: ViewMode) => void;
  setFilter: (filter: FilterKey) => void;
}

const initialState: SchedulePrefsState = {
  view: 'calendar',
  filter: 'upcoming',
};

export const useSchedulePrefsStore = create<SchedulePrefsState & SchedulePrefsActions>()(
  persist(
    (set) => ({
      ...initialState,

      setView(view) {
        set({ view });
      },

      setFilter(filter) {
        set({ filter });
      },
    }),
    {
      name: 'schedule-preferences',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
        }
        return localStorage;
      }),
    },
  ),
);
