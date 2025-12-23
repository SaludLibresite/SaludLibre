import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useDoctorsFilterStore } from '../store/doctorsFilterStore';

/**
 * Hook to sync doctors filters with URL query parameters
 * Enables shareable URLs with filter state
 */
export function useDoctorsFilterSync() {
  const router = useRouter();
  const isInitialMount = useRef(true);
  const isUpdatingFromURL = useRef(false);
  
  const {
    search,
    categoria,
    selectedGenero,
    selectedConsultaOnline,
    selectedRango,
    selectedBarrio,
    selectedPrepaga,
    selectedAgeGroup,
    currentPage,
    setFiltersFromURL
  } = useDoctorsFilterStore();

  // Read filters from URL on mount
  useEffect(() => {
    if (!router.isReady) return;
    
    if (isInitialMount.current) {
      isInitialMount.current = false;
      isUpdatingFromURL.current = true;
      
      const urlFilters = {};
      
      if (router.query.search) urlFilters.search = router.query.search;
      if (router.query.especialidad) urlFilters.categoria = router.query.especialidad;
      if (router.query.genero) urlFilters.selectedGenero = router.query.genero;
      if (router.query.online) urlFilters.selectedConsultaOnline = router.query.online;
      if (router.query.plan) urlFilters.selectedRango = router.query.plan;
      if (router.query.zona) urlFilters.selectedBarrio = router.query.zona;
      if (router.query.prepaga) urlFilters.selectedPrepaga = router.query.prepaga;
      if (router.query.edad) urlFilters.selectedAgeGroup = router.query.edad;
      if (router.query.pagina) urlFilters.currentPage = parseInt(router.query.pagina) || 1;
      
      if (Object.keys(urlFilters).length > 0) {
        setFiltersFromURL(urlFilters);
      }
      
      // Small delay to ensure store is updated
      setTimeout(() => {
        isUpdatingFromURL.current = false;
      }, 100);
    }
  }, [router.isReady, router.query, setFiltersFromURL]);

  // Update URL when filters change
  useEffect(() => {
    if (!router.isReady || isInitialMount.current || isUpdatingFromURL.current) return;
    
    const query = {};
    
    // Only add non-empty filters to URL
    if (search) query.search = search;
    if (categoria) query.especialidad = categoria;
    if (selectedGenero) query.genero = selectedGenero;
    if (selectedConsultaOnline) query.online = selectedConsultaOnline;
    if (selectedRango) query.plan = selectedRango;
    if (selectedBarrio) query.zona = selectedBarrio;
    if (selectedPrepaga) query.prepaga = selectedPrepaga;
    if (selectedAgeGroup) query.edad = selectedAgeGroup;
    if (currentPage > 1) query.pagina = currentPage.toString();
    
    // Update URL without triggering navigation
    router.replace(
      {
        pathname: router.pathname,
        query
      },
      undefined,
      { shallow: true, scroll: false }
    );
  }, [
    router,
    search,
    categoria,
    selectedGenero,
    selectedConsultaOnline,
    selectedRango,
    selectedBarrio,
    selectedPrepaga,
    selectedAgeGroup,
    currentPage
  ]);
}
