import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useVideoConsultationStore = create(
  persist(
    (set, get) => ({
      // Estado actual de la videoconsulta
      currentRoom: null,
      isInMeeting: false,
      meetingStartTime: null,
      participants: [],
      meetingStatus: 'idle', // idle, loading, active, ended, error
      
      // Acciones
      setCurrentRoom: (room) => {
        set({
          currentRoom: room,
          meetingStatus: room ? 'loading' : 'idle'
        });
      },

      setMeetingActive: () => {
        set({
          isInMeeting: true,
          meetingStatus: 'active',
          meetingStartTime: new Date().toISOString(),
        });
      },

      setMeetingEnded: () => {
        set({
          currentRoom: null,
          isInMeeting: false,
          meetingStartTime: null,
          participants: [],
          meetingStatus: 'idle'
        });
      },

      updateParticipants: (participants) => {
        set({ participants });
      },

      setMeetingError: (error) => {
        set({
          meetingStatus: 'error',
          errorMessage: error
        });
      },

      // Recuperar estado después de refresh
      restoreFromPersist: () => {
        const state = get();
        if (state.currentRoom && state.isInMeeting) {
          set({
            meetingStatus: 'loading',
          });
          return true;
        }
        return false;
      },

      // Limpiar completamente el estado
      clearAll: () => {
        set({
          currentRoom: null,
          isInMeeting: false,
          meetingStartTime: null,
          participants: [],
          meetingStatus: 'idle',
          errorMessage: null
        });
      }
    }),
    {
      name: 'video-consultation-storage',
      partialize: (state) => ({
        currentRoom: state.currentRoom,
        isInMeeting: state.isInMeeting,
        meetingStartTime: state.meetingStartTime,
        participants: state.participants,
        meetingStatus: state.meetingStatus
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Verificar si la reunión es muy antigua (más de 2 horas)
          if (state.meetingStartTime) {
            const startTime = new Date(state.meetingStartTime);
            const now = new Date();
            const diffHours = (now - startTime) / (1000 * 60 * 60);
            
            if (diffHours > 2) {
              state.currentRoom = null;
              state.isInMeeting = false;
              state.meetingStartTime = null;
              state.participants = [];
              state.meetingStatus = 'idle';
            }
          }
        }
      }
    }
  )
);

export default useVideoConsultationStore;
