import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useDoctorsFilterStore = create(
  persist(
    (set) => ({
      // Filter states
      search: "",
      categoria: "",
      selectedGenero: "",
      selectedConsultaOnline: "",
      selectedRango: "",
      selectedBarrio: "",
      selectedPrepaga: "",
      selectedAgeGroup: "",
      
      // Pagination
      currentPage: 1,
      
      // Map state (not persisted in URL)
      isMapOpen: false,
      
      // Nearby doctors (not persisted)
      nearbyDoctors: null,
      userLocation: null,
      showingNearby: false,
      
      // Actions
      setSearch: (value) => set({ search: value, currentPage: 1 }),
      setCategoria: (value) => set({ categoria: value, currentPage: 1 }),
      setSelectedGenero: (value) => set({ selectedGenero: value, currentPage: 1 }),
      setSelectedConsultaOnline: (value) => set({ selectedConsultaOnline: value, currentPage: 1 }),
      setSelectedRango: (value) => set({ selectedRango: value, currentPage: 1 }),
      setSelectedBarrio: (value) => set({ selectedBarrio: value, currentPage: 1 }),
      setSelectedPrepaga: (value) => set({ selectedPrepaga: value, currentPage: 1 }),
      setSelectedAgeGroup: (value) => set({ selectedAgeGroup: value, currentPage: 1 }),
      
      setCurrentPage: (page) => set({ currentPage: page }),
      
      setIsMapOpen: (isOpen) => set({ isMapOpen: isOpen }),
      
      setNearbyDoctors: (doctors, location) => set({ 
        nearbyDoctors: doctors, 
        userLocation: location,
        showingNearby: true 
      }),
      
      resetNearbyDoctors: () => set({ 
        nearbyDoctors: null, 
        userLocation: null,
        showingNearby: false,
        currentPage: 1
      }),
      
      // Reset all filters
      resetFilters: () => set({
        search: "",
        categoria: "",
        selectedGenero: "",
        selectedConsultaOnline: "",
        selectedRango: "",
        selectedBarrio: "",
        selectedPrepaga: "",
        selectedAgeGroup: "",
        currentPage: 1,
        nearbyDoctors: null,
        userLocation: null,
        showingNearby: false
      }),
      
      // Reset all filters except nearby
      resetFiltersExceptNearby: () => set({
        search: "",
        categoria: "",
        selectedGenero: "",
        selectedConsultaOnline: "",
        selectedRango: "",
        selectedBarrio: "",
        selectedPrepaga: "",
        selectedAgeGroup: "",
        currentPage: 1
      }),
      
      // Set multiple filters at once (useful for URL sync)
      setFiltersFromURL: (filters) => set(filters)
    }),
    {
      name: "doctors-filters-storage",
      // Only persist filter values, not transient state like map or nearby doctors
      partialize: (state) => ({
        search: state.search,
        categoria: state.categoria,
        selectedGenero: state.selectedGenero,
        selectedConsultaOnline: state.selectedConsultaOnline,
        selectedRango: state.selectedRango,
        selectedBarrio: state.selectedBarrio,
        selectedPrepaga: state.selectedPrepaga,
        selectedAgeGroup: state.selectedAgeGroup,
        currentPage: state.currentPage
      })
    }
  )
);
