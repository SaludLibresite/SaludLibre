import { create } from 'zustand';

interface PlatformSettingsState {
  freemiumMode: boolean;
}

interface PlatformSettingsActions {
  setFreemiumMode: (value: boolean) => void;
}

export const usePlatformSettingsStore = create<PlatformSettingsState & PlatformSettingsActions>()(
  (set) => ({
    freemiumMode: false,
    setFreemiumMode(value) {
      set({ freemiumMode: value });
    },
  }),
);
